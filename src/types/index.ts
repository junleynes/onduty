
export type UserRole = 'admin' | 'manager' | 'member';

export type Employee = {
  id: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  email: string;
  phone: string;
  password?: string;
  birthDate?: Date;
  startDate?: Date;
  position: string;
  role: UserRole;
  group?: string;
  avatar?: string;
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
  isHolidayOff?: boolean;
};

export type LeaveType = string;

export type Leave = {
  id: string;
  employeeId: string;
  type: LeaveType;
  color?: string;
  date: Date;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
};
