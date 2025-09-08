

import type { Employee, Shift, Leave, Note, Holiday, Task, CommunicationAllowance, SmtpSettings } from '@/types';
import { getInitialState } from './utils';
import type { LeaveTypeOption } from '@/components/leave-type-editor';

// In a full SQLite implementation, these would be queries to the database.
// For now, we provide hardcoded initial values.

export const initialEmployees: Employee[] = [];
export const initialShifts: Shift[] = [];
export const initialLeave: Leave[] = [];
export const initialTasks: Task[] = [];
export const initialCommunicationAllowances: CommunicationAllowance[] = [];
export const initialSmtpSettings: SmtpSettings = {};
export const initialNotes: Note[] = [];
export const initialHolidays: Holiday[] = [];
export const initialGroups: string[] = [];

export const initialShiftTemplates: {
  name: string;
  label: string;
  startTime: string;
  endTime: string;
  color: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isUnpaidBreak?: boolean;
}[] = [];

export const initialLeaveTypes: LeaveTypeOption[] = [
  { type: 'VL', color: '#3b82f6' },
  { type: 'SL', color: '#f97316' },
  { type: 'EL', color: '#ef4444' },
  { type: 'WFH', color: '#22c55e' },
  { type: 'OB', color: '#8b5cf6' },
  { type: 'TARDY', color: '#eab308' },
  { type: 'Work Extension', color: '#6b7280' },
];


export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null): Employee | null => {
  if (!id) return null;
  const employees = getInitialState<Employee[]>('employees', []);
  return employees.find(e => e.id === id) || null;
};
