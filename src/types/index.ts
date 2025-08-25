
export type UserRole = 'admin' | 'employee';

export type Employee = {
  id: string;
  name: string;
  avatar: string;
  role: 'Manager' | 'Chef' | 'Barista' | 'Cashier';
};

export type Shift = {
  id: string;
  employeeId: string | null; // null for unassigned
  label: string;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  date: Date;
  color?: string;
  isDayOff?: boolean;
};

export type LeaveType = 'Vacation' | 'Emergency' | 'Unavailable' | 'Time Off Request';

export type Leave = {
  id: string;
  employeeId: string;
  type: LeaveType;
  date: Date;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
};
