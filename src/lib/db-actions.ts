
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
  try {
    const upsertEmployeeStmt = db.prepare(`
      INSERT INTO employees (id, employeeNumber, firstName, lastName, middleInitial, email, phone, password, position, role, groupName, avatar, loadAllocation, reportsTo, birthDate, startDate, signature, visibility, lastPromotionDate)
      VALUES (@id, @employeeNumber, @firstName, @lastName, @middleInitial, @email, @phone, @password, @position, @role, @groupName, @avatar, @loadAllocation, @reportsTo, @birthDate, @startDate, @signature, @visibility, @lastPromotionDate)
      ON CONFLICT(id) DO UPDATE SET
        employeeNumber=excluded.employeeNumber, firstName=excluded.firstName, lastName=excluded.lastName, middleInitial=excluded.middleInitial, email=excluded.email, phone=excluded.phone,
        password=excluded.password, position=excluded.position, role=excluded.role, groupName=excluded.groupName, avatar=excluded.avatar, loadAllocation=excluded.loadAllocation,
        reportsTo=excluded.reportsTo, birthDate=excluded.birthDate, startDate=excluded.startDate, signature=excluded.signature, visibility=excluded.visibility, lastPromotionDate=excluded.lastPromotionDate
    `);

    const deleteEmployeeStmt = db.prepare('DELETE FROM employees WHERE id = ?');
    
    const upsertShiftStmt = db.prepare(`
        INSERT INTO shifts (id, employeeId, label, startTime, endTime, date, color, isDayOff, isHolidayOff, status, breakStartTime, breakEndTime, isUnpaidBreak)
        VALUES (@id, @employeeId, @label, @startTime, @endTime, @date, @color, @isDayOff, @isHolidayOff, @status, @breakStartTime, @breakEndTime, @isUnpaidBreak)
        ON CONFLICT(id) DO UPDATE SET
            employeeId=excluded.employeeId, label=excluded.label, startTime=excluded.startTime, endTime=excluded.endTime, date=excluded.date, color=excluded.color,
            isDayOff=excluded.isDayOff, isHolidayOff=excluded.isHolidayOff, status=excluded.status, breakStartTime=excluded.breakStartTime, breakEndTime=excluded.breakEndTime, isUnpaidBreak=excluded.isUnpaidBreak
    `);

    const deleteShiftStmt = db.prepare('DELETE FROM shifts WHERE id = ?');

    const upsertLeaveStmt = db.prepare(`
      INSERT INTO leave (id, employeeId, type, color, date, isAllDay, startTime, endTime, status, reason, requestedAt, managedBy, managedAt, originalShiftDate, originalStartTime, originalEndTime)
      VALUES (@id, @employeeId, @type, @color, @date, @isAllDay, @startTime, @endTime, @status, @reason, @requestedAt, @managedBy, @managedAt, @originalShiftDate, @originalStartTime, @originalEndTime)
      ON CONFLICT(id) DO UPDATE SET
        employeeId=excluded.employeeId, type=excluded.type, color=excluded.color, date=excluded.date, isAllDay=excluded.isAllDay, startTime=excluded.startTime, endTime=excluded.endTime,
        status=excluded.status, reason=excluded.reason, requestedAt=excluded.requestedAt, managedBy=excluded.managedBy, managedAt=excluded.managedAt, originalShiftDate=excluded.originalShiftDate,
        originalStartTime=excluded.originalStartTime, originalEndTime=excluded.originalEndTime
    `);
    const deleteLeaveStmt = db.prepare('DELETE FROM leave WHERE id = ?');
    
    const upsertNoteStmt = db.prepare('INSERT INTO notes (id, date, title, description) VALUES (@id, @date, @title, @description) ON CONFLICT(id) DO UPDATE SET date=excluded.date, title=excluded.title, description=excluded.description');
    const deleteNoteStmt = db.prepare('DELETE FROM notes WHERE id = ?');

    const upsertHolidayStmt = db.prepare('INSERT INTO holidays (id, date, title) VALUES (@id, @date, @title) ON CONFLICT(id) DO UPDATE SET date=excluded.date, title=excluded.title');
    const deleteHolidayStmt = db.prepare('DELETE FROM holidays WHERE id = ?');
    
    const upsertTaskStmt = db.prepare(`
      INSERT INTO tasks (id, shiftId, assigneeId, scope, title, description, status, completedAt, dueDate, createdBy)
      VALUES (@id, @shiftId, @assigneeId, @scope, @title, @description, @status, @completedAt, @dueDate, @createdBy)
      ON CONFLICT(id) DO UPDATE SET
        shiftId=excluded.shiftId, assigneeId=excluded.assigneeId, scope=excluded.scope, title=excluded.title, description=excluded.description,
        status=excluded.status, completedAt=excluded.completedAt, dueDate=excluded.dueDate, createdBy=excluded.createdBy
    `);
    const deleteTaskStmt = db.prepare('DELETE FROM tasks WHERE id = ?');

    const upsertAllowanceStmt = db.prepare(`
      INSERT INTO communication_allowances (id, employeeId, year, month, balance, asOfDate, screenshot)
      VALUES (@id, @employeeId, @year, @month, @balance, @asOfDate, @screenshot)
      ON CONFLICT(id) DO UPDATE SET
        employeeId=excluded.employeeId, year=excluded.year, month=excluded.month, balance=excluded.balance, asOfDate=excluded.asOfDate, screenshot=excluded.screenshot
    `);
    const deleteAllowanceStmt = db.prepare('DELETE FROM communication_allowances WHERE id = ?');
    
    const upsertGroupStmt = db.prepare('INSERT INTO groups (name) VALUES (?) ON CONFLICT(name) DO NOTHING');
    const deleteGroupStmt = db.prepare('DELETE FROM groups WHERE name = ?');
    
    const upsertSmtpSettingsStmt = db.prepare(`
        INSERT INTO smtp_settings (id, host, port, secure, user, pass, fromEmail, fromName)
        VALUES (1, @host, @port, @secure, @user, @pass, @fromEmail, @fromName)
        ON CONFLICT(id) DO UPDATE SET
            host=excluded.host, port=excluded.port, secure=excluded.secure, user=excluded.user,
            pass=excluded.pass, fromEmail=excluded.fromEmail, fromName=excluded.fromName
    `);

    const upsertTardyRecordStmt = db.prepare('INSERT INTO tardy_records (employeeId, employeeName, date, schedule, timeIn, timeOut, remarks) VALUES (@employeeId, @employeeName, @date, @schedule, @timeIn, @timeOut, @remarks)');
    
    const upsertTemplateStmt = db.prepare('INSERT INTO key_value_store (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value=excluded.value');


    const saveTransaction = db.transaction(() => {
      // Employees
      const dbEmployees = db.prepare('SELECT id, password FROM employees').all() as {id: string, password?: string}[];
      const dbEmployeeMap = new Map(dbEmployees.map(e => [e.id, e]));
      const stateEmployeeIds = new Set(employees.map(e => e.id));
      
      for (const emp of employees) {
        const empToSave = { ...emp };
        const dbEmp = dbEmployeeMap.get(empToSave.id);
        
        if (!empToSave.password && dbEmp) {
            empToSave.password = dbEmp.password;
        } else if (!empToSave.password && !dbEmp) {
            empToSave.password = 'password';
        }

        upsertEmployeeStmt.run({
            ...empToSave,
            groupName: empToSave.group,
            birthDate: empToSave.birthDate ? new Date(empToSave.birthDate).toISOString() : null,
            startDate: empToSave.startDate ? new Date(empToSave.startDate).toISOString() : null,
            lastPromotionDate: empToSave.lastPromotionDate ? new Date(empToSave.lastPromotionDate).toISOString() : null,
            visibility: JSON.stringify(empToSave.visibility || {}),
        });
      }
      for (const dbEmp of dbEmployees) {
          if (!stateEmployeeIds.has(dbEmp.id) && dbEmp.id !== 'emp-admin-01') { 
              deleteEmployeeStmt.run(dbEmp.id);
          }
      }

      // Shifts
      const dbShiftIds = new Set(db.prepare('SELECT id FROM shifts').all().map((s: any) => s.id));
      const stateShiftIds = new Set(shifts.map(s => s.id));
      for (const shift of shifts) {
          upsertShiftStmt.run({
              ...shift,
              date: new Date(shift.date).toISOString().split('T')[0],
              isDayOff: shift.isDayOff ? 1 : 0,
              isHolidayOff: shift.isHolidayOff ? 1 : 0,
              isUnpaidBreak: shift.isUnpaidBreak ? 1 : 0
          });
      }
      for (const dbId of dbShiftIds) {
          if (!stateShiftIds.has(dbId)) deleteShiftStmt.run(dbId);
      }
      
      // Leave
      const dbLeaveIds = new Set(db.prepare('SELECT id FROM leave').all().map((l: any) => l.id));
      const stateLeaveIds = new Set(leave.map(l => l.id));
       for (const l of leave) {
          upsertLeaveStmt.run({
              ...l,
              date: new Date(l.date).toISOString().split('T')[0],
              isAllDay: l.isAllDay ? 1 : 0,
              requestedAt: l.requestedAt? new Date(l.requestedAt).toISOString() : undefined,
              managedAt: l.managedAt? new Date(l.managedAt).toISOString() : undefined,
              originalShiftDate: l.originalShiftDate? new Date(l.originalShiftDate).toISOString().split('T')[0] : undefined
          });
      }
      for (const dbId of dbLeaveIds) {
          if (!stateLeaveIds.has(dbId)) deleteLeaveStmt.run(dbId);
      }

      // Notes
      const dbNoteIds = new Set(db.prepare('SELECT id FROM notes').all().map((n: any) => n.id));
      const stateNoteIds = new Set(notes.map(n => n.id));
      for (const note of notes) {
        upsertNoteStmt.run({ ...note, date: new Date(note.date).toISOString().split('T')[0] });
      }
      for (const dbId of dbNoteIds) {
        if (!stateNoteIds.has(dbId)) deleteNoteStmt.run(dbId);
      }
      
      // Holidays
      const dbHolidayIds = new Set(db.prepare('SELECT id FROM holidays').all().map((h: any) => h.id));
      const stateHolidayIds = new Set(holidays.map(h => h.id));
       for (const holiday of holidays) {
        upsertHolidayStmt.run({ ...holiday, date: new Date(holiday.date).toISOString().split('T')[0] });
      }
      for (const dbId of dbHolidayIds) {
        if (!stateHolidayIds.has(dbId)) deleteHolidayStmt.run(dbId);
      }

      // Tasks
      const dbTaskIds = new Set(db.prepare('SELECT id FROM tasks').all().map((t: any) => t.id));
      const stateTaskIds = new Set(tasks.map(t => t.id));
      for (const task of tasks) {
        upsertTaskStmt.run({
            ...task,
            completedAt: task.completedAt? new Date(task.completedAt).toISOString() : undefined,
            dueDate: task.dueDate? new Date(task.dueDate).toISOString() : undefined,
        });
      }
      for (const dbId of dbTaskIds) {
        if (!stateTaskIds.has(dbId)) deleteTaskStmt.run(dbId);
      }

      // Allowances
      const dbAllowanceIds = new Set(db.prepare('SELECT id FROM communication_allowances').all().map((a: any) => a.id));
      const stateAllowanceIds = new Set(allowances.map(a => a.id));
       for (const allowance of allowances) {
        upsertAllowanceStmt.run({
            ...allowance,
            asOfDate: allowance.asOfDate? new Date(allowance.asOfDate).toISOString() : undefined,
        });
      }
      for (const dbId of dbAllowanceIds) {
        if (!stateAllowanceIds.has(dbId)) deleteAllowanceStmt.run(dbId);
      }
      
      // Groups
      const dbGroups = new Set(db.prepare('SELECT name FROM groups').all().map((g: any) => g.name));
      const stateGroups = new Set(groups);
      for (const group of stateGroups) {
          if (!dbGroups.has(group)) upsertGroupStmt.run(group);
      }
      for (const dbGroup of dbGroups) {
          if (!stateGroups.has(dbGroup)) deleteGroupStmt.run(dbGroup);
      }

      // SMTP Settings
      upsertSmtpSettingsStmt.run({
          ...smtpSettings,
          secure: smtpSettings.secure ? 1 : 0
      });
      
      // Tardy Records (Import-only, so we just clear and insert)
      db.prepare('DELETE FROM tardy_records').run();
      for (const record of tardyRecords) {
        upsertTardyRecordStmt.run({
            ...record,
            date: new Date(record.date).toISOString().split('T')[0]
        });
      }
      
      // Templates
      for (const [key, value] of Object.entries(templates)) {
        if (value) {
            upsertTemplateStmt.run({ key, value });
        }
      }

    });

    saveTransaction();

    return { success: true };
  } catch (error) {
    console.error('Failed to save data:', error);
    return { success: false, error: (error as Error).message };
  }
}

    