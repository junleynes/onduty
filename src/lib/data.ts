import type { Employee, Shift, Leave } from '@/types';

export const employees: Employee[] = [
  { id: 'emp-001', name: 'Alice Johnson', role: 'Manager', avatar: '/avatars/01.png' },
  { id: 'emp-002', name: 'Bob Williams', role: 'Chef', avatar: '/avatars/02.png' },
  { id: 'emp-003', name: 'Charlie Brown', role: 'Barista', avatar: '/avatars/03.png' },
  { id: 'emp-004', name: 'Diana Miller', role: 'Cashier', avatar: '/avatars/04.png' },
  { id: 'emp-005', name: 'Ethan Davis', role: 'Barista', avatar: '/avatars/05.png' },
  { id: 'emp-006', name: 'Fiona Wilson', role: 'Chef', avatar: '/avatars/06.png' },
];

export const shifts: Shift[] = [
  // Unassigned
  { id: 'sh-u1', employeeId: null, date: new Date(2024, 6, 23), startTime: '09:00', endTime: '17:00', label: 'Morning Shift', color: 'hsl(var(--chart-4))' },
  // Assigned
  { id: 'sh-01', employeeId: 'emp-001', date: new Date(2024, 6, 22), startTime: '08:00', endTime: '16:00', label: 'Manager Shift', color: 'hsl(var(--chart-2))' },
  { id: 'sh-02', employeeId: 'emp-002', date: new Date(2024, 6, 22), startTime: '09:00', endTime: '17:00', label: 'Kitchen Prep', color: 'hsl(var(--chart-1))' },
  { id: 'sh-03', employeeId: 'emp-003', date: new Date(2024, 6, 22), startTime: '08:00', endTime: '12:00', label: 'Opening Barista', color: 'hsl(var(--chart-5))' },
  { id: 'sh-04', employeeId: 'emp-004', date: new Date(2024, 6, 22), startTime: '12:00', endTime: '20:00', label: 'Cashier Close', color: 'hsl(var(--chart-3))' },
  { id: 'sh-05', employeeId: 'emp-002', date: new Date(2024, 6, 23), startTime: '10:00', endTime: '18:00', label: 'Chef Shift', color: 'hsl(var(--chart-1))' },
  { id: 'sh-06', employeeId: 'emp-003', date: new Date(2024, 6, 23), startTime: '08:00', endTime: '16:00', label: 'Barista Shift', color: 'hsl(var(--chart-5))' },
  { id: 'sh-07', employeeId: 'emp-005', date: new Date(2024, 6, 24), startTime: '14:00', endTime: '22:00', label: 'Closing Barista', color: 'hsl(var(--chart-5))' },
  { id: 'sh-08', employeeId: 'emp-001', date: new Date(2024, 6, 24), startTime: '08:00', endTime: '16:00', label: 'Manager Shift', color: 'hsl(var(--chart-2))' },
  { id: 'sh-09', employeeId: 'emp-006', date: new Date(2024, 6, 24), startTime: '09:00', endTime: '17:00', label: 'Grill Master', color: 'hsl(var(--chart-1))' },
  { id: 'sh-10', employeeId: 'emp-004', date: new Date(2024, 6, 25), startTime: '12:00', endTime: '20:00', label: 'Mid Shift', color: 'hsl(var(--chart-3))' },
  { id: 'sh-11', employeeId: 'emp-003', date: new Date(2024, 6, 25), startTime: '10:00', endTime: '18:00', label: 'Afternoon Rush', color: 'hsl(var(--chart-5))' },
  { id: 'sh-12', employeeId: 'emp-005', date: new Date(2024, 6, 26), startTime: '08:00', endTime: '16:00', label: 'Weekend Opener', color: 'hsl(var(--chart-5))' },
  { id: 'sh-13', employeeId: 'emp-001', date: new Date(2024, 6, 26), startTime: '08:00', endTime: '16:00', label: 'Weekend Manager', color: 'hsl(var(--chart-2))' },
  { id: 'sh-14', employeeId: 'emp-002', date: new Date(2024, 6, 27), startTime: '14:00', endTime: '22:00', label: 'Dinner Service', color: 'hsl(var(--chart-1))' },
  { id: 'sh-15', employeeId: 'emp-006', date: new Date(2024, 6, 27), startTime: '14:00', endTime: '22:00', label: 'Dinner Service', color: 'hsl(var(--chart-1))' },
];

export const leave: Leave[] = [
    { id: 'leave-1', employeeId: 'emp-006', type: 'Vacation', date: new Date(2024, 6, 22), isAllDay: true },
    { id: 'leave-2', employeeId: 'emp-004', type: 'Unavailable', date: new Date(2024, 6, 26), isAllDay: true },
    { id: 'leave-3', employeeId: 'emp-005', type: 'Time Off Request', date: new Date(2024, 6, 23), isAllDay: false, startTime: '08:00', endTime: '12:00' },
];


export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string) => employees.find(e => e.id === id);
