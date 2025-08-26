
import type { Employee, Shift, Leave } from '@/types';

export const employees: Employee[] = [];

export const shifts: Shift[] = [];

export const leave: Leave[] = [];


export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null) => {
  if (!id) return null;
  // This function will now be less effective as the static array is empty,
  // but the app passes the live employee list as props where needed.
  return employees.find(e => e.id === id);
};
