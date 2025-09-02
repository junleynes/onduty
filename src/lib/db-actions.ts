
'use server';

import { db } from './db';
import type { Employee, Shift, Leave, Note, Holiday, Task, CommunicationAllowance, SmtpSettings, AppVisibility } from '@/types';
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

    // Process data to match client-side types (e.g., parsing JSON, converting dates)
    const processedEmployees: Employee[] = employees.map(e => ({
      ...e,
      birthDate: e.birthDate ? new Date(e.birthDate) : undefined,
      startDate: e.startDate ? new Date(e.startDate) : undefined,
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
        smtpSettings
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
}) {
  try {
    const upsertEmployee = db.prepare(`
      INSERT INTO employees (id, employeeNumber, firstName, lastName, middleInitial, email, phone, password, position, role, groupName, avatar, loadAllocation, reportsTo, birthDate, startDate, signature, visibility, lastPromotionDate)
      VALUES (@id, @employeeNumber, @firstName, @lastName, @middleInitial, @email, @phone, @password, @position, @role, @groupName, @avatar, @loadAllocation, @reportsTo, @birthDate, @startDate, @signature, @visibility, @lastPromotionDate)
      ON CONFLICT(id) DO UPDATE SET
        employeeNumber=excluded.employeeNumber, firstName=excluded.firstName, lastName=excluded.lastName, middleInitial=excluded.middleInitial, email=excluded.email, phone=excluded.phone,
        password=excluded.password, position=excluded.position, role=excluded.role, groupName=excluded.groupName, avatar=excluded.avatar, loadAllocation=excluded.loadAllocation,
        reportsTo=excluded.reportsTo, birthDate=excluded.birthDate, startDate=excluded.startDate, signature=excluded.signature, visibility=excluded.visibility, lastPromotionDate=excluded.lastPromotionDate
    `);

    const deleteEmployee = db.prepare('DELETE FROM employees WHERE id = ?');
    
    const upsertShift = db.prepare(`
        INSERT INTO shifts (id, employeeId, label, startTime, endTime, date, color, isDayOff, isHolidayOff, status, breakStartTime, breakEndTime, isUnpaidBreak)
        VALUES (@id, @employeeId, @label, @startTime, @endTime, @date, @color, @isDayOff, @isHolidayOff, @status, @breakStartTime, @breakEndTime, @isUnpaidBreak)
        ON CONFLICT(id) DO UPDATE SET
            employeeId=excluded.employeeId, label=excluded.label, startTime=excluded.startTime, endTime=excluded.endTime, date=excluded.date, color=excluded.color,
            isDayOff=excluded.isDayOff, isHolidayOff=excluded.isHolidayOff, status=excluded.status, breakStartTime=excluded.breakStartTime, breakEndTime=excluded.breakEndTime, isUnpaidBreak=excluded.isUnpaidBreak
    `);

    const deleteShift = db.prepare('DELETE FROM shifts WHERE id = ?');

    // Add similar statements for leave, notes, holidays, tasks, allowances
    const upsertLeave = db.prepare(`
      INSERT INTO leave (id, employeeId, type, color, date, isAllDay, startTime, endTime, status, reason, requestedAt, managedBy, managedAt, originalShiftDate, originalStartTime, originalEndTime)
      VALUES (@id, @employeeId, @type, @color, @date, @isAllDay, @startTime, @endTime, @status, @reason, @requestedAt, @managedBy, @managedAt, @originalShiftDate, @originalStartTime, @originalEndTime)
      ON CONFLICT(id) DO UPDATE SET
        employeeId=excluded.employeeId, type=excluded.type, color=excluded.color, date=excluded.date, isAllDay=excluded.isAllDay, startTime=excluded.startTime, endTime=excluded.endTime,
        status=excluded.status, reason=excluded.reason, requestedAt=excluded.requestedAt, managedBy=excluded.managedBy, managedAt=excluded.managedAt, originalShiftDate=excluded.originalShiftDate,
        originalStartTime=excluded.originalStartTime, originalEndTime=excluded.originalEndTime
    `);
    const deleteLeave = db.prepare('DELETE FROM leave WHERE id = ?');
    
    const upsertNote = db.prepare('INSERT INTO notes (id, date, title, description) VALUES (@id, @date, @title, @description) ON CONFLICT(id) DO UPDATE SET date=excluded.date, title=excluded.title, description=excluded.description');
    const deleteNote = db.prepare('DELETE FROM notes WHERE id = ?');

    const upsertHoliday = db.prepare('INSERT INTO holidays (id, date, title) VALUES (@id, @date, @title) ON CONFLICT(id) DO UPDATE SET date=excluded.date, title=excluded.title');
    const deleteHoliday = db.prepare('DELETE FROM holidays WHERE id = ?');
    
    const upsertTask = db.prepare(`
      INSERT INTO tasks (id, shiftId, assigneeId, scope, title, description, status, completedAt, dueDate, createdBy)
      VALUES (@id, @shiftId, @assigneeId, @scope, @title, @description, @status, @completedAt, @dueDate, @createdBy)
      ON CONFLICT(id) DO UPDATE SET
        shiftId=excluded.shiftId, assigneeId=excluded.assigneeId, scope=excluded.scope, title=excluded.title, description=excluded.description,
        status=excluded.status, completedAt=excluded.completedAt, dueDate=excluded.dueDate, createdBy=excluded.createdBy
    `);
    const deleteTask = db.prepare('DELETE FROM tasks WHERE id = ?');

    const upsertAllowance = db.prepare(`
      INSERT INTO communication_allowances (id, employeeId, year, month, balance, asOfDate, screenshot)
      VALUES (@id, @employeeId, @year, @month, @balance, @asOfDate, @screenshot)
      ON CONFLICT(id) DO UPDATE SET
        employeeId=excluded.employeeId, year=excluded.year, month=excluded.month, balance=excluded.balance, asOfDate=excluded.asOfDate, screenshot=excluded.screenshot
    `);
    const deleteAllowance = db.prepare('DELETE FROM communication_allowances WHERE id = ?');
    
    const upsertGroup = db.prepare('INSERT INTO groups (name) VALUES (?) ON CONFLICT(name) DO NOTHING');
    const deleteGroup = db.prepare('DELETE FROM groups WHERE name = ?');
    
    const upsertSmtpSettings = db.prepare(`
        INSERT INTO smtp_settings (id, host, port, secure, user, pass, fromEmail, fromName)
        VALUES (1, @host, @port, @secure, @user, @pass, @fromEmail, @fromName)
        ON CONFLICT(id) DO UPDATE SET
            host=excluded.host, port=excluded.port, secure=excluded.secure, user=excluded.user,
            pass=excluded.pass, fromEmail=excluded.fromEmail, fromName=excluded.fromName
    `);


    const saveTransaction = db.transaction(() => {
      // Employees
      const dbEmployees = db.prepare('SELECT id, password FROM employees').all() as {id: string, password?: string}[];
      const stateEmployeeIds = new Set(employees.map(e => e.id));
      
      for (const emp of employees) {
        const dbEmp = dbEmployees.find(dbe => dbe.id === emp.id);
        const password = emp.password || dbEmp?.password || 'password'; // Keep old password if new one isn't provided
        upsertEmployee.run({
            ...emp,
            id: emp.id || uuidv4(),
            birthDate: emp.birthDate ? emp.birthDate.toISOString() : null,
            startDate: emp.startDate ? emp.startDate.toISOString() : null,
            lastPromotionDate: emp.lastPromotionDate ? emp.lastPromotionDate.toISOString() : null,
            visibility: JSON.stringify(emp.visibility || {}),
            groupName: emp.group,
            password,
        });
      }
      for (const dbEmp of dbEmployees) {
          if (!stateEmployeeIds.has(dbEmp.id)) {
              deleteEmployee.run(dbEmp.id);
          }
      }

      // Shifts
      const dbShiftIds = new Set(db.prepare('SELECT id FROM shifts').all().map((s: any) => s.id));
      const stateShiftIds = new Set(shifts.map(s => s.id));
      for (const shift of shifts) {
          upsertShift.run({
              ...shift,
              date: shift.date.toISOString().split('T')[0],
              isDayOff: shift.isDayOff ? 1 : 0,
              isHolidayOff: shift.isHolidayOff ? 1 : 0,
              isUnpaidBreak: shift.isUnpaidBreak ? 1 : 0
          });
      }
      for (const dbId of dbShiftIds) {
          if (!stateShiftIds.has(dbId)) {
              deleteShift.run(dbId);
          }
      }
      
      // Leave
      const dbLeaveIds = new Set(db.prepare('SELECT id FROM leave').all().map((l: any) => l.id));
      const stateLeaveIds = new Set(leave.map(l => l.id));
       for (const l of leave) {
          upsertLeave.run({
              ...l,
              date: l.date.toISOString().split('T')[0],
              isAllDay: l.isAllDay ? 1 : 0,
              requestedAt: l.requestedAt?.toISOString(),
              managedAt: l.managedAt?.toISOString(),
              originalShiftDate: l.originalShiftDate?.toISOString().split('T')[0]
          });
      }
      for (const dbId of dbLeaveIds) {
          if (!stateLeaveIds.has(dbId)) {
              deleteLeave.run(dbId);
          }
      }

      // Notes
      const dbNoteIds = new Set(db.prepare('SELECT id FROM notes').all().map((n: any) => n.id));
      const stateNoteIds = new Set(notes.map(n => n.id));
      for (const note of notes) {
        upsertNote.run({ ...note, date: note.date.toISOString().split('T')[0] });
      }
      for (const dbId of dbNoteIds) {
        if (!stateNoteIds.has(dbId)) deleteNote.run(dbId);
      }
      
      // Holidays
      const dbHolidayIds = new Set(db.prepare('SELECT id FROM holidays').all().map((h: any) => h.id));
      const stateHolidayIds = new Set(holidays.map(h => h.id));
       for (const holiday of holidays) {
        upsertHoliday.run({ ...holiday, date: holiday.date.toISOString().split('T')[0] });
      }
      for (const dbId of dbHolidayIds) {
        if (!stateHolidayIds.has(dbId)) deleteHoliday.run(dbId);
      }

      // Tasks
      const dbTaskIds = new Set(db.prepare('SELECT id FROM tasks').all().map((t: any) => t.id));
      const stateTaskIds = new Set(tasks.map(t => t.id));
      for (const task of tasks) {
        upsertTask.run({
            ...task,
            completedAt: task.completedAt?.toISOString(),
            dueDate: task.dueDate?.toISOString(),
        });
      }
      for (const dbId of dbTaskIds) {
        if (!stateTaskIds.has(dbId)) deleteTask.run(dbId);
      }

      // Allowances
      const dbAllowanceIds = new Set(db.prepare('SELECT id FROM communication_allowances').all().map((a: any) => a.id));
      const stateAllowanceIds = new Set(allowances.map(a => a.id));
       for (const allowance of allowances) {
        upsertAllowance.run({
            ...allowance,
            asOfDate: allowance.asOfDate?.toISOString(),
        });
      }
      for (const dbId of dbAllowanceIds) {
        if (!stateAllowanceIds.has(dbId)) deleteAllowance.run(dbId);
      }
      
      // Groups
      const dbGroups = new Set(db.prepare('SELECT name FROM groups').all().map((g: any) => g.name));
      const stateGroups = new Set(groups);
      for (const group of stateGroups) {
          if (!dbGroups.has(group)) upsertGroup.run(group);
      }
      for (const dbGroup of dbGroups) {
          if (!stateGroups.has(dbGroup)) deleteGroup.run(dbGroup);
      }

      // SMTP Settings
      upsertSmtpSettings.run({
          ...smtpSettings,
          secure: smtpSettings.secure ? 1 : 0
      });
      
    });

    saveTransaction();

    return { success: true };
  } catch (error) {
    console.error('Failed to save data:', error);
    return { success: false, error: (error as Error).message };
  }
}
