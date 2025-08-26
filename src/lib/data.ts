
import type { Employee, Shift, Leave } from '@/types';

export const employees: Employee[] = [
    {
        id: 'emp-001',
        firstName: 'Rodrigo',
        lastName: 'Leynes Jr',
        middleInitial: '',
        position: 'Manager',
        birthDate: new Date('1982-08-21'),
        startDate: new Date('2006-02-16'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-002',
        firstName: 'Areanne',
        lastName: 'Ortigoza',
        middleInitial: '',
        position: 'Junior MAMS Support Engineer',
        birthDate: new Date('2000-01-17'),
        startDate: new Date('2024-09-16'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-003',
        firstName: 'Joenathan',
        lastName: 'Dumlao',
        middleInitial: '',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2005-04-18'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-004',
        firstName: 'Eugene',
        lastName: 'Horfilla',
        middleInitial: '',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2013-03-01'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-005',
        firstName: 'Franz Arnett',
        lastName: 'Valois',
        middleInitial: '',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2004-10-18'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-006',
        firstName: 'Anthony Paul',
        lastName: 'Villaceran',
        middleInitial: '',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2001-11-08'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-007',
        firstName: 'Mark Louie',
        lastName: 'Naval',
        middleInitial: '',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2006-01-16'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-008',
        firstName: 'Paulo',
        lastName: 'Ramos',
        middleInitial: '',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2003-04-28'),
        department: 'Post-Production',
        section: '',
        email: '',
    },
    {
        id: 'emp-009',
        firstName: 'Jad',
        lastName: 'Doringo',
        middleInitial: '',
        position: 'Junior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2010-12-16'),
        department: 'Post-Production',
        section: '',
        email: '',
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
