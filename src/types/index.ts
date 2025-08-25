export type UserRole = 'admin' | 'employee';

export type Employee = {
  id: string;
  name: string;
  avatar: string;
  role: 'Manager' | 'Chef' | 'Barista' | 'Cashier';
};

export type Shift = {
  id: string;
  employeeId: string;
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  date: Date;
  color?: string;
};
