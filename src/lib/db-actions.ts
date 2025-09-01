
'use server';

import { db } from './db';
import type { Employee, Shift, Leave, Note, Holiday, Task, CommunicationAllowance, SmtpSettings, AppVisibility } from '@/types';

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
