

import type { Employee, Shift, Leave, Note, Holiday, Task, CommunicationAllowance, SmtpSettings } from '@/types';
import { getInitialState } from './utils';

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
export const initialGroups: string[] = ['Administration'];

export const initialShiftTemplates = [
    {
      "name": "Opening Shift (6am-2pm)",
      "label": "Open",
      "startTime": "06:00",
      "endTime": "14:00",
      "color": "hsl(var(--chart-2))"
    },
    {
      "name": "Mid Shift (10am-6pm)",
      "label": "Mid",
      "startTime": "10:00",
      "endTime": "18:00",
      "color": "hsl(var(--chart-4))"
    },
    {
      "name": "Closing Shift (2pm-10pm)",
      "label": "Close",
      "startTime": "14:00",
      "endTime": "22:00",
      "color": "hsl(var(--chart-1))"
    },
    {
      "name": "Manager Shift (9am-5pm)",
      "label": "Manager",
      "startTime": "09:00",
      "endTime": "17:00",
      "color": "hsl(var(--chart-5))",
      "breakStartTime": "12:00",
      "breakEndTime": "13:00",
      "isUnpaidBreak": true
    },
    {
      "name": "Work From Home",
      "label": "WFH",
      "startTime": "09:00",
      "endTime": "17:00",
      "color": "#3498db"
    }
];

export const initialLeaveTypes = [
    { "type": "VL", "color": "#3498db" },
    { "type": "SL", "color": "#e74c3c" },
    { "type": "EL", "color": "#f1c40f" },
    { "type": "BL", "color": "#9b59b6" },
    { "type": "ML", "color": "#e74c3c" },
    { "type": "PL", "color": "#9b59b6" },
    { "type": "OFFSET", "color": "#1abc9c" },
    { "type": "Work Extension", "color": "#2ecc71"},
    { "type": "TARDY", "color": "#e67e22" }
];


export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null): Employee | null => {
  if (!id) return null;
  const employees = getInitialState<Employee[]>('employees', []);
  return employees.find(e => e.id === id) || null;
};
