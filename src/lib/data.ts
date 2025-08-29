
import type { Employee, Shift, Leave } from '@/types';
import db from './db.json';

export const employees: Employee[] = db.employees;
export const shifts: Shift[] = db.shifts;
export const leave: Leave[] = db.leave;
export const initialGroups: string[] = db.groups;
export const initialShiftTemplates = db.shiftTemplates;
export const initialLeaveTypes = db.leaveTypes;

export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null) => {
  if (!id) return null;
  // This function will now be less effective as it's reading from a static import,
  // but the app passes the live employee list as props where needed.
  return employees.find(e => e.id === id);
};
