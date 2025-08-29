
import type { Employee, Shift, Leave, Note, Holiday } from '@/types';
import initialDb from './db.json';

// While transitioning to SQLite, we keep the JSON as a fallback for initial data.
// In a full SQLite implementation, these would be queries to the database.

export const employees: Employee[] = initialDb.employees;
export const shifts: Shift[] = initialDb.shifts;
export const leave: Leave[] = initialDb.leave;
export const initialGroups: string[] = initialDb.groups;
export const initialShiftTemplates = initialDb.shiftTemplates;
export const initialLeaveTypes = initialDb.leaveTypes;
export const initialNotes: Note[] = initialDb.notes;
export const initialHolidays: Holiday[] = initialDb.holidays.map(h => ({...h, date: new Date(h.date)}));

export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null) => {
  if (!id) return null;
  // This function will now be less effective as it's reading from a static import,
  // but the app passes the live employee list as props where needed.
  return employees.find(e => e.id === id);
};
