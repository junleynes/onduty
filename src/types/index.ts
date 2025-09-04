

export type UserRole = 'admin' | 'manager' | 'member';

export type AppVisibility = {
  schedule?: boolean;
  onDuty?: boolean;
  orgChart?: boolean;
  mobileLoad?: boolean;
};

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
  lastPromotionDate?: Date;
  position: string;
  role: UserRole;
  group?: string;
  avatar?: string;
  signature?: string;
  loadAllocation?: number;
  reportsTo?: string | null;
  visibility?: AppVisibility;
};

export type Shift = {
  id:string;
  employeeId: string | null; // null for unassigned
  label: string;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  date: Date;
  color?: string;
  isDayOff?: boolean;
  isHolidayOff?: boolean;
  status?: 'draft' | 'published';
  breakStartTime?: string;
  breakEndTime?: string;
  isUnpaidBreak?: boolean;
};

export type LeaveType = string;

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export type Leave = {
  id: string; // The unique ID of the original request
  requestId?: string; // The original request ID, for grouped records
  employeeId: string;
  type: LeaveType;
  color?: string;
  date: Date; // The specific date this record applies to
  startDate: Date; // The start of the original requested range
  endDate: Date; // The end of the original requested range
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  status?: LeaveRequestStatus;
  reason?: string;
  requestedAt?: Date;
  managedBy?: string; // ID of manager who approved/rejected
  managedAt?: Date;
  originalShiftDate?: Date;
  originalStartTime?: string;
  originalEndTime?: string;
};

export type Notification = {
  id: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  employeeId?: string; // Optional: for user-specific notifications
  link?: string; // Optional: for linking to a specific page
};

export type Note = {
    id: string;
    date: Date;
    title: string;
    description: string;
};

export type Holiday = {
    id: string;
    date: Date;
    title: string;
};

export type Task = {
  id: string;
  shiftId?: string | null; // Optional: for shift-specific tasks
  assigneeId?: string | null; // Optional: for personal tasks
  scope: 'personal' | 'global' | 'shift';
  title: string;
  description: string;
  status: 'pending' | 'completed';
  completedAt?: Date;
  dueDate?: Date;
  createdBy: string; // Employee ID
};

export type CommunicationAllowance = {
  id: string;
  employeeId: string;
  year: number;
  month: number; // 0-11
  balance: number;
  asOfDate?: Date;
  screenshot?: string; // base64 string
};

export type SmtpSettings = {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  fromEmail?: string;
  fromName?: string;
};

export type TardyRecord = {
  employeeId: string;
  employeeName: string;
  date: Date;
  schedule: string;
  timeIn: string;
  timeOut: string;
  remarks: string;
}

    