
import type { Employee, Shift, Leave } from '@/types';

export const employees: Employee[] = [
  { 
    id: 'emp-001', 
    employeeNumber: 'E001',
    firstName: 'Alice', 
    lastName: 'Johnson', 
    middleInitial: 'M',
    email: 'alice.j@example.com',
    phone: '123-456-7890',
    birthDate: new Date('1990-05-15'),
    startDate: new Date('2022-01-10'),
    position: 'Manager', 
    department: 'Operations',
    section: 'Management',
    avatar: '/avatars/01.png' 
  },
  { 
    id: 'emp-002', 
    employeeNumber: 'E002',
    firstName: 'Bob', 
    lastName: 'Williams', 
    middleInitial: 'F',
    email: 'bob.w@example.com',
    phone: '234-567-8901',
    birthDate: new Date('1988-09-20'),
    startDate: new Date('2021-11-20'),
    position: 'Chef', 
    department: 'Kitchen',
    section: 'Hot Line',
    avatar: '/avatars/02.png' 
  },
  { 
    id: 'emp-003', 
    employeeNumber: 'E003',
    firstName: 'Charlie', 
    lastName: 'Brown', 
    middleInitial: '',
    email: 'charlie.b@example.com',
    phone: '345-678-9012',
    birthDate: new Date('1995-12-10'),
    startDate: new Date('2023-03-15'),
    position: 'Barista', 
    department: 'Front of House',
    section: 'Coffee Bar',
    avatar: '/avatars/03.png' 
  },
  { 
    id: 'emp-004', 
    employeeNumber: 'E004',
    firstName: 'Diana', 
    lastName: 'Miller', 
    middleInitial: 'S',
    email: 'diana.m@example.com',
    phone: '456-789-0123',
    birthDate: new Date('1998-02-25'),
    startDate: new Date('2023-06-01'),
    position: 'Cashier', 
    department: 'Front of House',
    section: 'Point of Sale',
    avatar: '/avatars/04.png' 
  },
  { 
    id: 'emp-005', 
    employeeNumber: 'E005',
    firstName: 'Ethan', 
    lastName: 'Davis', 
    middleInitial: 'P',
    email: 'ethan.d@example.com',
    phone: '567-890-1234',
    birthDate: new Date('2000-07-30'),
    startDate: new Date('2023-09-01'),
    position: 'Barista', 
    department: 'Front of House',
    section: 'Coffee Bar',
    avatar: '/avatars/05.png' 
  },
  { 
    id: 'emp-006', 
    employeeNumber: 'E006',
    firstName: 'Fiona', 
    lastName: 'Wilson', 
    middleInitial: '',
    email: 'fiona.w@example.com',
    phone: '678-901-2345',
    birthDate: new Date('1992-11-18'),
    startDate: new Date('2022-08-20'),
    position: 'Chef', 
    department: 'Kitchen',
    section: 'Pastry',
    avatar: '/avatars/06.png' 
  },
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
  { id: 'sh-16', employeeId: 'emp-001', date: new Date(2024, 6, 25), startTime: '', endTime: '', label: 'Day Off', isDayOff: true },

];

export const leave: Leave[] = [
    { id: 'leave-1', employeeId: 'emp-006', type: 'Vacation', date: new Date(2024, 6, 22), isAllDay: true },
    { id: 'leave-2', employeeId: 'emp-004', type: 'Unavailable', date: new Date(2024, 6, 26), isAllDay: true },
    { id: 'leave-3', employeeId: 'emp-005', type: 'Time Off Request', date: new Date(2024, 6, 23), isAllDay: false, startTime: '08:00', endTime: '12:00' },
];


export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null) => {
  if (!id) return null;
  return employees.find(e => e.id === id);
};
