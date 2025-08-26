
import type { Employee, Shift, Leave } from '@/types';

export const employees: Employee[] = [
    {
        id: 'emp-001',
        employeeNumber: '001',
        firstName: 'Rodrigo',
        lastName: 'Leynes Jr',
        middleInitial: 'E',
        position: 'Manager',
        birthDate: new Date('1982-08-21'),
        startDate: new Date('2006-02-16'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-002',
        employeeNumber: '002',
        firstName: 'Areanne',
        lastName: 'Ortigoza',
        middleInitial: 'V',
        position: 'Junior MAMS Support Engineer',
        birthDate: new Date('2000-01-17'),
        startDate: new Date('2024-09-16'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-003',
        employeeNumber: '003',
        firstName: 'Joenathan',
        lastName: 'Dumlao',
        middleInitial: 'V',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2005-04-18'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-004',
        employeeNumber: '004',
        firstName: 'Eugene',
        lastName: 'Horfilla',
        middleInitial: 'B',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2013-03-01'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-005',
        employeeNumber: '005',
        firstName: 'Franz Arnett',
        lastName: 'Valois',
        middleInitial: 'S',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2004-10-18'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-006',
        employeeNumber: '006',
        firstName: 'Anthony Paul',
        lastName: 'Villaceran',
        middleInitial: 'V',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2001-11-08'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-007',
        employeeNumber: '007',
        firstName: 'Mark Louie',
        lastName: 'Naval',
        middleInitial: 'L',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2006-01-16'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-008',
        employeeNumber: '008',
        firstName: 'Paulo',
        lastName: 'Ramos',
        middleInitial: 'R',
        position: 'Senior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2003-04-28'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-009',
        employeeNumber: '009',
        firstName: 'Jad',
        lastName: 'Doringo',
        middleInitial: 'I',
        position: 'Junior MAMS Support Engineer',
        birthDate: undefined,
        startDate: new Date('2010-12-16'),
        department: 'Post Production',
        section: '',
        email: ''
    },
    {
        id: 'emp-010',
        employeeNumber: '010',
        firstName: 'Marvin',
        lastName: 'Mamuyac',
        middleInitial: 'J',
        position: 'Senior Manager',
        birthDate: undefined,
        startDate: undefined,
        department: 'Post Production',
        section: '',
        email: ''
    }
];

export const shifts: Shift[] = [];

export const leave: Leave[] = [];


export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null) => {
  if (!id) return null;
  return employees.find(e => e.id === id);
};
