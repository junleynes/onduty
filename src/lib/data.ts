import type { Employee, Shift } from '@/types';

export const employees: Employee[] = [
  { id: 'emp-001', name: 'Alice Johnson', role: 'Manager', avatar: '/avatars/01.png' },
  { id: 'emp-002', name: 'Bob Williams', role: 'Chef', avatar: '/avatars/02.png' },
  { id: 'emp-003', name: 'Charlie Brown', role: 'Barista', avatar: '/avatars/03.png' },
  { id: 'emp-004', name: 'Diana Miller', role: 'Cashier', avatar: '/avatars/04.png' },
  { id: 'emp-005', name: 'Ethan Davis', role: 'Barista', avatar: '/avatars/05.png' },
  { id: 'emp-006', name: 'Fiona Wilson', role: 'Chef', avatar: '/avatars/06.png' },
];

export const shifts: Shift[] = [
  { id: 'sh-01', employeeId: 'emp-001', day: 'Mon', startTime: '08:00', endTime: '16:00' },
  { id: 'sh-02', employeeId: 'emp-002', day: 'Mon', startTime: '09:00', endTime: '17:00' },
  { id: 'sh-03', employeeId: 'emp-003', day: 'Mon', startTime: '08:00', endTime: '12:00' },
  { id: 'sh-04', employeeId: 'emp-004', day: 'Mon', startTime: '12:00', endTime: '20:00' },
  { id: 'sh-05', employeeId: 'emp-002', day: 'Tue', startTime: '10:00', endTime: '18:00' },
  { id: 'sh-06', employeeId: 'emp-003', day: 'Tue', startTime: '08:00', endTime: '16:00' },
  { id: 'sh-07', employeeId: 'emp-005', day: 'Tue', startTime: '14:00', endTime: '22:00' },
  { id: 'sh-08', employeeId: 'emp-001', day: 'Wed', startTime: '08:00', endTime: '16:00' },
  { id: 'sh-09', employeeId: 'emp-006', day: 'Wed', startTime: '09:00', endTime: '17:00' },
  { id: 'sh-10', employeeId: 'emp-004', day: 'Wed', startTime: '12:00', endTime: '20:00' },
  { id: 'sh-11', employeeId: 'emp-003', day: 'Thu', startTime: '10:00', endTime: '18:00' },
  { id: 'sh-12', employeeId: 'emp-005', day: 'Thu', startTime: '08:00', endTime: '16:00' },
  { id: 'sh-13', employeeId: 'emp-001', day: 'Fri', startTime: '08:00', endTime: '16:00' },
  { id: 'sh-14', employeeId: 'emp-002', day: 'Fri', startTime: '14:00', endTime: '22:00' },
  { id: 'sh-15', employeeId: 'emp-006', day: 'Fri', startTime: '14:00', endTime: '22:00' },
  { id: 'sh-16', employeeId: 'emp-004', day: 'Sat', startTime: '10:00', endTime: '18:00' },
  { id: 'sh-17', employeeId: 'emp-005', day: 'Sat', startTime: '12:00', endTime: '20:00' },
];

export const weekDays: Shift['day'][] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string) => employees.find(e => e.id === id);
