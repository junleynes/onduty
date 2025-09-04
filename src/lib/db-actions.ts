
'use server';

import { getDb } from './db';
import type { Employee, Shift, Leave, Note, Holiday, Task, CommunicationAllowance, SmtpSettings, AppVisibility, TardyRecord } from '@/types';
import type { ShiftTemplate } from '@/components/shift-editor';
import type { LeaveTypeOption } from './leave-type-editor';
import { eachDayOfInterval, format } from 'date-fns';

function safeParseJSON(jsonString: string | null | undefined, defaultValue: any) {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

export async function getData() {
  const db = getDb();
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
    
    const shiftTemplates = db.prepare('SELECT * FROM shift_templates').all() as any[];
    const leaveTypes = db.prepare('SELECT * FROM leave_types').all() as any[];
    
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
      date: new Date(l.date), // Each row is a single day now
      startDate: new Date(l.startDate), // Keep original range for context if needed
      endDate: new Date(l.endDate),
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
    
    const processedAllowances: CommunicationAllowance[] = allowances.map(a => ({
        ...a,
        asOfDate: a.asOfDate ? new Date(a.asOfDate) : undefined,
    }));
    
    const processedShiftTemplates: ShiftTemplate[] = shiftTemplates.map(t => ({
        ...t,
        id: t.id ?? `tpl-${Math.random()}`,
        isUnpaidBreak: t.isUnpaidBreak === 1,
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
        allowances: processedAllowances,
        groups,
        smtpSettings,
        tardyRecords: processedTardyRecords,
        templates,
        shiftTemplates: processedShiftTemplates,
        leaveTypes,
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
  shiftTemplates,
  leaveTypes,
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
  shiftTemplates: ShiftTemplate[];
  leaveTypes: LeaveTypeOption[];
}) {
  const db = getDb();
  const saveTransaction = db.transaction(() => {
    
    // --- EMPLOYEES ---
    // First, figure out which employees are being deleted
    const allDbEmployeeIds = new Set(db.prepare('SELECT id from employees').all().map((row: any) => row.id));
    const employeeIdsInState = new Set(employees.map(e => e.id));
    const employeesToDelete = [...allDbEmployeeIds].filter(id => !employeeIdsInState.has(id));

    // Delete employees who are no longer in the state. ON DELETE CASCADE will handle related data.
    if (employeesToDelete.length > 0) {
      const deleteStmt = db.prepare(`DELETE FROM employees WHERE id IN (${employeesToDelete.map(() => '?').join(',')})`);
      deleteStmt.run(...employeesToDelete);
    }
    
    // Now, upsert all current employees
    const empUpsertStmt = db.prepare(`
      INSERT INTO employees (id, employeeNumber, firstName, lastName, middleInitial, email, phone, password, position, role, "group", avatar, loadAllocation, reportsTo, birthDate, startDate, signature, visibility, lastPromotionDate)
      VALUES (@id, @employeeNumber, @firstName, @lastName, @middleInitial, @email, @phone, @password, @position, @role, @group, @avatar, @loadAllocation, @reportsTo, @birthDate, @startDate, @signature, @visibility, @lastPromotionDate)
      ON CONFLICT(id) DO UPDATE SET
        employeeNumber=excluded.employeeNumber, firstName=excluded.firstName, lastName=excluded.lastName, middleInitial=excluded.middleInitial, email=excluded.email, phone=excluded.phone,
        password=excluded.password, position=excluded.position, role=excluded.role, "group"=excluded."group", avatar=excluded.avatar, loadAllocation=excluded.loadAllocation,
        reportsTo=excluded.reportsTo, birthDate=excluded.birthDate, startDate=excluded.startDate, signature=excluded.signature, visibility=excluded.visibility, lastPromotionDate=excluded.lastPromotionDate
    `);

    const getPasswordStmt = db.prepare('SELECT password FROM employees WHERE id = ?');
    for (const emp of employees) {
      let finalPassword = emp.password;
      if (!finalPassword && emp.id) {
        const existing = getPasswordStmt.get(emp.id);
        finalPassword = existing ? (existing as any).password : 'password'; 
      }
      
      const visibility = emp.visibility || {};
      empUpsertStmt.run({
        id: emp.id,
        employeeNumber: emp.employeeNumber || null,
        firstName: emp.firstName,
        lastName: emp.lastName,
        middleInitial: emp.middleInitial || null,
        email: emp.email,
        phone: emp.phone || null,
        password: finalPassword,
        position: emp.position || null,
        role: emp.role,
        group: emp.group || null,
        avatar: emp.avatar || null,
        loadAllocation: emp.loadAllocation || 0,
        reportsTo: emp.reportsTo || null,
        birthDate: emp.birthDate ? new Date(emp.birthDate).toISOString() : null,
        startDate: emp.startDate ? new Date(emp.startDate).toISOString() : null,
        signature: emp.signature || null,
        visibility: JSON.stringify(visibility),
        lastPromotionDate: emp.lastPromotionDate ? new Date(emp.lastPromotionDate).toISOString() : null,
      });
    }
    
    // --- SHIFTS ---
    db.prepare('DELETE FROM shifts WHERE employeeId IS NULL OR employeeId IN (SELECT id FROM employees)').run();
    const shiftStmt = db.prepare('INSERT INTO shifts (id, employeeId, label, startTime, endTime, date, color, isDayOff, isHolidayOff, status, breakStartTime, breakEndTime, isUnpaidBreak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for(const shift of shifts) {
      shiftStmt.run(shift.id, shift.employeeId, shift.label, shift.startTime, shift.endTime, new Date(shift.date).toISOString().split('T')[0], shift.color, shift.isDayOff ? 1 : 0, shift.isHolidayOff ? 1 : 0, shift.status, shift.breakStartTime, shift.breakEndTime, shift.isUnpaidBreak ? 1 : 0);
    }

    // --- LEAVE ---
    db.prepare('DELETE FROM leave WHERE employeeId IN (SELECT id FROM employees)').run();
    const leaveStmt = db.prepare('INSERT INTO leave (id, requestId, employeeId, type, color, date, isAllDay, startTime, endTime, status, reason, requestedAt, managedBy, managedAt, originalShiftDate, originalStartTime, originalEndTime, startDate, endDate) VALUES (@id, @requestId, @employeeId, @type, @color, @date, @isAllDay, @startTime, @endTime, @status, @reason, @requestedAt, @managedBy, @managedAt, @originalShiftDate, @originalStartTime, @originalEndTime, @startDate, @endDate)');
    for(const l of leave) {
        if (!l.endDate) l.endDate = l.startDate; 
        const days = eachDayOfInterval({ start: new Date(l.startDate), end: new Date(l.endDate) });
        
        for (const day of days) {
           leaveStmt.run({
                id: `${l.id}-${format(day, 'yyyy-MM-dd')}`,
                requestId: l.id,
                employeeId: l.employeeId,
                type: l.type,
                color: l.color,
                date: day.toISOString().split('T')[0],
                isAllDay: l.isAllDay ? 1 : 0, 
                startTime: l.startTime, 
                endTime: l.endTime, 
                status: l.status, 
                reason: l.reason, 
                requestedAt: l.requestedAt?.toISOString(), 
                managedBy: l.managedBy, 
                managedAt: l.managedAt?.toISOString(),
                originalShiftDate: l.originalShiftDate?.toISOString(),
                originalStartTime: l.originalStartTime,
                originalEndTime: l.originalEndTime,
                startDate: new Date(l.startDate).toISOString(), 
                endDate: new Date(l.endDate).toISOString(),
            });
        }
    }


    // --- NOTES ---
    db.prepare('DELETE FROM notes').run();
    const noteStmt = db.prepare('INSERT INTO notes (id, date, title, description) VALUES (?, ?, ?, ?)');
    notes.forEach(note => {
        noteStmt.run(note.id, new Date(note.date).toISOString().split('T')[0], note.title, note.description);
    });

    // --- HOLIDAYS ---
    db.prepare('DELETE FROM holidays').run();
    const holidayUpsertStmt = db.prepare('INSERT INTO holidays (id, date, title) VALUES (@id, @date, @title) ON CONFLICT(id) DO UPDATE SET date=excluded.date, title=excluded.title');
    for(const holiday of holidays) {
      holidayUpsertStmt.run({id: holiday.id, date: new Date(holiday.date).toISOString().split('T')[0], title: holiday.title});
    }

    // --- TASKS ---
    db.prepare('DELETE FROM tasks WHERE createdBy IN (SELECT id FROM employees)').run();
    const taskStmt = db.prepare('INSERT INTO tasks (id, shiftId, assigneeId, scope, title, description, status, completedAt, dueDate, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for(const task of tasks) {
      taskStmt.run(task.id, task.shiftId, task.assigneeId, task.scope, task.title, task.description, task.status, task.completedAt?.toISOString(), task.dueDate?.toISOString(), task.createdBy);
    }

    // --- ALLOWANCES ---
    db.prepare('DELETE FROM communication_allowances WHERE employeeId IN (SELECT id FROM employees)').run();
    const allowanceStmt = db.prepare('INSERT INTO communication_allowances (id, employeeId, year, month, balance, asOfDate, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for(const allowance of allowances) {
        allowanceStmt.run(allowance.id, allowance.employeeId, allowance.year, allowance.month, allowance.balance, allowance.asOfDate ? new Date(allowance.asOfDate).toISOString() : null, allowance.screenshot);
    }
    
    // --- GROUPS ---
    db.prepare('DELETE FROM groups').run();
    const groupStmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
    for (const group of groups) {
      groupStmt.run(group);
    }

    // --- SMTP SETTINGS ---
    if (smtpSettings && smtpSettings.host) {
        const smtpStmt = db.prepare(`
        INSERT INTO smtp_settings (id, host, port, secure, user, pass, fromEmail, fromName)
        VALUES (1, @host, @port, @secure, @user, @pass, @fromEmail, @fromName)
        ON CONFLICT(id) DO UPDATE SET
            host=excluded.host, port=excluded.port, secure=excluded.secure, user=excluded.user,
            pass=excluded.pass, fromEmail=excluded.fromEmail, fromName=excluded.fromName
        `);
        smtpStmt.run({ 
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: smtpSettings.secure ? 1 : 0,
            user: smtpSettings.user || null,
            pass: smtpSettings.pass || null,
            fromEmail: smtpSettings.fromEmail,
            fromName: smtpSettings.fromName
        });
    }

    // --- TARDY RECORDS ---
    db.prepare('DELETE FROM tardy_records WHERE employeeId IN (SELECT id FROM employees)').run();
    const tardyStmt = db.prepare('INSERT INTO tardy_records (employeeId, employeeName, date, schedule, timeIn, timeOut, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for(const record of tardyRecords) {
        tardyStmt.run(record.employeeId, record.employeeName, new Date(record.date).toISOString().split('T')[0], record.schedule, record.timeIn, record.timeOut, record.remarks);
    }
    
    // --- SHIFT TEMPLATES ---
    db.prepare('DELETE FROM shift_templates').run();
    const shiftTemplateUpsertStmt = db.prepare('INSERT INTO shift_templates (id, name, label, startTime, endTime, color, breakStartTime, breakEndTime, isUnpaidBreak) VALUES (@id, @name, @label, @startTime, @endTime, @color, @breakStartTime, @breakEndTime, @isUnpaidBreak) ON CONFLICT(id) DO UPDATE SET name=excluded.name, label=excluded.label, startTime=excluded.startTime, endTime=excluded.endTime, color=excluded.color, breakStartTime=excluded.breakStartTime, breakEndTime=excluded.breakEndTime, isUnpaidBreak=excluded.isUnpaidBreak');
    for(const tpl of shiftTemplates) {
        shiftTemplateUpsertStmt.run({
            id: tpl.id,
            name: tpl.name,
            label: tpl.label,
            startTime: tpl.startTime,
            endTime: tpl.endTime,
            color: tpl.color,
            breakStartTime: tpl.breakStartTime || null,
            breakEndTime: tpl.breakEndTime || null,
            isUnpaidBreak: tpl.isUnpaidBreak ? 1 : 0
        });
    }

    // --- LEAVE TYPES ---
    db.prepare('DELETE FROM leave_types').run();
    const leaveTypeUpsertStmt = db.prepare('INSERT INTO leave_types (type, color) VALUES (@type, @color) ON CONFLICT(type) DO UPDATE SET color=excluded.color');
    for (const lt of leaveTypes) {
        leaveTypeUpsertStmt.run(lt);
    }

    // --- KEY-VALUE STORE (e.g. excel templates) ---
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
