
'use server';

import { db } from './db';
import type { Employee, Shift, Leave, Note, Holiday, Task, CommunicationAllowance, SmtpSettings, AppVisibility, TardyRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function safeParseJSON(jsonString: string | null | undefined, defaultValue: any) {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

export async function getData() {
  try {
    const employees = db.prepare('SELECT * FROM employees').all() as any[];
    const shifts = db.prepare('SELECT * FROM shifts').all() as any[];
    const leave = db.prepare('SELECT * FROM leave').all() as any[];
    const notes = db.prepare('SELECT * FROM notes').all() as any[];
    const holidays = db.prepare('SELECT * FROM holidays').all() as any[];
    const tasks = db.prepare('SELECT * FROM tasks').all() as any[];
    const allowances = db.prepare('SELECT * FROM communication_allowances').all() as any[];
    const groups = db.prepare('SELECT name FROM groups').all().map((g: any) => g.name) as string[];
    const smtpSettings: SmtpSettings = db.prepare('SELECT * FROM smtp_settings WHERE id = 1').get() as any || {};
    const tardyRecords = db.prepare('SELECT * FROM tardy_records').all() as any[];
    
    const keyValuePairs = db.prepare('SELECT * FROM key_value_store').all() as {key: string, value: string}[];
    const templates = keyValuePairs.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as Record<string, string | null>);


    // Process data to match client-side types (e.g., parsing JSON, converting dates)
    const processedEmployees: Employee[] = employees.map(e => ({
      ...e,
      birthDate: e.birthDate ? new Date(e.birthDate) : undefined,
      startDate: e.startDate ? new Date(e.startDate) : undefined,
      lastPromotionDate: e.lastPromotionDate ? new Date(e.lastPromotionDate) : undefined,
      visibility: safeParseJSON(e.visibility, {
        schedule: true,
        onDuty: true,
        orgChart: true,
        mobileLoad: true,
      }) as AppVisibility
    }));

    const processedShifts: Shift[] = shifts.map(s => ({
      ...s,
      date: new Date(s.date),
      isDayOff: s.isDayOff === 1,
      isHolidayOff: s.isHolidayOff === 1,
      isUnpaidBreak: s.isUnpaidBreak === 1,
    }));
    
    const processedLeave: Leave[] = leave.map((l: any) => ({
      ...l,
      date: new Date(l.date),
      isAllDay: l.isAllDay === 1,
      requestedAt: l.requestedAt ? new Date(l.requestedAt) : undefined,
      managedAt: l.managedAt ? new Date(l.managedAt) : undefined,
      originalShiftDate: l.originalShiftDate ? new Date(l.originalShiftDate) : undefined,
    }));
    
    const processedNotes: Note[] = notes.map(n => ({
      ...n,
      date: new Date(n.date),
    }));

    const processedHolidays: Holiday[] = holidays.map(h => ({
      ...h,
      date: new Date(h.date),
    }));

    const processedTasks: Task[] = tasks.map(t => ({
      ...t,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
    }));

    const processedTardyRecords: TardyRecord[] = tardyRecords.map(t => ({
        ...t,
        date: new Date(t.date),
    }));


    return {
      success: true,
      data: {
        employees: processedEmployees,
        shifts: processedShifts,
        leave: processedLeave,
        notes: processedNotes,
        holidays: processedHolidays,
        tasks: processedTasks,
        allowances,
        groups,
        smtpSettings,
        tardyRecords: processedTardyRecords,
        templates,
      }
    };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { success: false, error: (error as Error).message };
  }
}


export async function saveAllData({
  employees,
  shifts,
  leave,
  notes,
  holidays,
  tasks,
  allowances,
  groups,
  smtpSettings,
  tardyRecords,
  templates,
}: {
  employees: Employee[];
  shifts: Shift[];
  leave: Leave[];
  notes: Note[];
  holidays: Holiday[];
  tasks: Task[];
  allowances: CommunicationAllowance[];
  groups: string[];
  smtpSettings: SmtpSettings;
  tardyRecords: TardyRecord[];
  templates: Record<string, string | null>;
}) {
  const saveTransaction = db.transaction(() => {
    // --- EMPLOYEES ---
    const empStmt = db.prepare(`
      INSERT INTO employees (id, employeeNumber, firstName, lastName, middleInitial, email, phone, password, position, role, groupName, avatar, loadAllocation, reportsTo, birthDate, startDate, signature, visibility, lastPromotionDate)
      VALUES (@id, @employeeNumber, @firstName, @lastName, @middleInitial, @email, @phone, @password, @position, @role, @groupName, @avatar, @loadAllocation, @reportsTo, @birthDate, @startDate, @signature, @visibility, @lastPromotionDate)
      ON CONFLICT(id) DO UPDATE SET
        employeeNumber=excluded.employeeNumber, firstName=excluded.firstName, lastName=excluded.lastName, middleInitial=excluded.middleInitial, email=excluded.email, phone=excluded.phone,
        password=excluded.password, position=excluded.position, role=excluded.role, groupName=excluded.groupName, avatar=excluded.avatar, loadAllocation=excluded.loadAllocation,
        reportsTo=excluded.reportsTo, birthDate=excluded.birthDate, startDate=excluded.startDate, signature=excluded.signature, visibility=excluded.visibility, lastPromotionDate=excluded.lastPromotionDate
    `);

    const existingPasswords = new Map(
      db.prepare('SELECT id, password FROM employees').all().map((e: any) => [e.id, e.password])
    );
    const employeeIdsInState = new Set(employees.map(e => e.id));

    for (const emp of employees) {
      empStmt.run({
        ...emp,
        groupName: emp.group,
        password: emp.password || existingPasswords.get(emp.id) || 'password', // Fallback for new users
        birthDate: emp.birthDate ? new Date(emp.birthDate).toISOString() : null,
        startDate: emp.startDate ? new Date(emp.startDate).toISOString() : null,
        lastPromotionDate: emp.lastPromotionDate ? new Date(emp.lastPromotionDate).toISOString() : null,
        visibility: JSON.stringify(emp.visibility || {}),
      });
    }

    const employeesToDelete = Array.from(existingPasswords.keys()).filter(id => !employeeIdsInState.has(id));
    if (employeesToDelete.length > 0) {
      const deleteStmt = db.prepare(`DELETE FROM employees WHERE id IN (${employeesToDelete.map(() => '?').join(',')})`);
      deleteStmt.run(...employeesToDelete);
    }
    
    // --- SHIFTS ---
    db.prepare('DELETE FROM shifts').run();
    const shiftStmt = db.prepare('INSERT INTO shifts (id, employeeId, label, startTime, endTime, date, color, isDayOff, isHolidayOff, status, breakStartTime, breakEndTime, isUnpaidBreak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for(const shift of shifts) {
      shiftStmt.run(shift.id, shift.employeeId, shift.label, shift.startTime, shift.endTime, new Date(shift.date).toISOString().split('T')[0], shift.color, shift.isDayOff ? 1 : 0, shift.isHolidayOff ? 1 : 0, shift.status, shift.breakStartTime, shift.breakEndTime, shift.isUnpaidBreak ? 1 : 0);
    }

    // --- LEAVE ---
    db.prepare('DELETE FROM leave').run();
    const leaveStmt = db.prepare('INSERT INTO leave (id, employeeId, type, color, date, isAllDay, startTime, endTime, status, reason, requestedAt, managedBy, managedAt, originalShiftDate, originalStartTime, originalEndTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for(const l of leave) {
      leaveStmt.run(l.id, l.employeeId, l.type, l.color, new Date(l.date).toISOString().split('T')[0], l.isAllDay ? 1 : 0, l.startTime, l.endTime, l.status, l.reason, l.requestedAt?.toISOString(), l.managedBy, l.managedAt?.toISOString(), l.originalShiftDate?.toISOString().split('T')[0], l.originalStartTime, l.originalEndTime);
    }

    // --- NOTES ---
    db.prepare('DELETE FROM notes').run();
    const noteStmt = db.prepare('INSERT INTO notes (id, date, title, description) VALUES (?, ?, ?, ?)');
    for(const note of notes) {
      noteStmt.run(note.id, new Date(note.date).toISOString().split('T')[0], note.title, note.description);
    }

    // --- HOLIDAYS ---
    db.prepare('DELETE FROM holidays').run();
    const holidayStmt = db.prepare('INSERT INTO holidays (id, date, title) VALUES (?, ?, ?)');
    for(const holiday of holidays) {
      holidayStmt.run(holiday.id, new Date(holiday.date).toISOString().split('T')[0], holiday.title);
    }

    // --- TASKS ---
    db.prepare('DELETE FROM tasks').run();
    const taskStmt = db.prepare('INSERT INTO tasks (id, shiftId, assigneeId, scope, title, description, status, completedAt, dueDate, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for(const task of tasks) {
      taskStmt.run(task.id, task.shiftId, task.assigneeId, task.scope, task.title, task.description, task.status, task.completedAt?.toISOString(), task.dueDate?.toISOString(), task.createdBy);
    }

    // --- ALLOWANCES ---
    db.prepare('DELETE FROM communication_allowances').run();
    const allowanceStmt = db.prepare('INSERT INTO communication_allowances (id, employeeId, year, month, balance, asOfDate, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for(const allowance of allowances) {
        allowanceStmt.run(allowance.id, allowance.employeeId, allowance.year, allowance.month, allowance.balance, allowance.asOfDate?.toISOString(), allowance.screenshot);
    }
    
    // --- GROUPS ---
    db.prepare('DELETE FROM groups').run();
    const groupStmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
    for (const group of groups) {
      groupStmt.run(group);
    }

    // --- SMTP SETTINGS ---
    const smtpStmt = db.prepare(`
      INSERT INTO smtp_settings (id, host, port, secure, user, pass, fromEmail, fromName)
      VALUES (1, @host, @port, @secure, @user, @pass, @fromEmail, @fromName)
      ON CONFLICT(id) DO UPDATE SET
          host=excluded.host, port=excluded.port, secure=excluded.secure, user=excluded.user,
          pass=excluded.pass, fromEmail=excluded.fromEmail, fromName=excluded.fromName
    `);
    smtpStmt.run({ ...smtpSettings, secure: smtpSettings.secure ? 1 : 0 });

    // --- TARDY RECORDS ---
    db.prepare('DELETE FROM tardy_records').run();
    const tardyStmt = db.prepare('INSERT INTO tardy_records (employeeId, employeeName, date, schedule, timeIn, timeOut, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for(const record of tardyRecords) {
        tardyStmt.run(record.employeeId, record.employeeName, new Date(record.date).toISOString().split('T')[0], record.schedule, record.timeIn, record.timeOut, record.remarks);
    }

    // --- TEMPLATES (Key-Value Store) ---
    const templateStmt = db.prepare('INSERT INTO key_value_store (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    for(const [key, value] of Object.entries(templates)) {
      if (value) {
        templateStmt.run({ key, value });
      }
    }
  });

  try {
    saveTransaction();
    return { success: true };
  } catch (error) {
    console.error('Failed to save data:', error);
    return { success: false, error: (error as Error).message };
  }
}
