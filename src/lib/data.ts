

import type { Employee, Shift, Leave, Note, Holiday, Task, CommunicationAllowance } from '@/types';
import initialDb from './db.json';

// While transitioning to SQLite, we keep the JSON as a fallback for initial data.
// In a full SQLite implementation, these would be queries to the database.

export const employees: Employee[] = initialDb.employees.map(e => ({
    ...e,
    birthDate: e.birthDate ? new Date(e.birthDate) : undefined,
    startDate: e.startDate ? new Date(e.startDate) : undefined,
}));

export const shifts: Shift[] = initialDb.shifts.map(s => ({
    ...s,
    date: new Date(s.date),
}));

export const leave: Leave[] = initialDb.leave.map(l => ({
    ...l,
    date: new Date(l.date),
}));

export const tasks: Task[] = initialDb.tasks.map((t: any) => ({
    ...t,
    completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
}));

export const communicationAllowances: CommunicationAllowance[] = initialDb.communicationAllowances;

export const initialGroups: string[] = initialDb.groups;
export const initialShiftTemplates = initialDb.shiftTemplates;
export const initialLeaveTypes = initialDb.leaveTypes;
export const initialTasks: Task[] = tasks;

export const initialNotes: Note[] = initialDb.notes.map(n => ({
    ...n,
    date: new Date(n.date),
}));
export const initialHolidays: Holiday[] = initialDb.holidays.map(h => ({
    ...h, 
    date: new Date(h.date)
}));

export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null) => {
  if (!id) return null;
  // This function will now be less effective as it's reading from a static import,
  // but the app passes the live employee list as props where needed.
  return employees.find(e => e.id === id);
};
