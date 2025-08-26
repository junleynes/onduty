
import type { Employee, Shift, Leave } from '@/types';

export const employees: Employee[] = [
    {
        id: 'emp-admin-01',
        employeeNumber: '001',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@shiftmaster.com',
        phone: '123-456-7890',
        password: 'password',
        position: 'System Administrator',
        role: 'admin',
        department: 'IT',
    },
    {
        id: 'emp-manager-01',
        employeeNumber: '002',
        firstName: 'Admin',
        lastName: 'Manager',
        email: 'manager@shiftmaster.com',
        phone: '123-456-7890',
        password: 'password',
        position: 'Manager',
        role: 'manager',
        department: 'Management',
    },
     {
        id: 'emp-employee-01',
        employeeNumber: '003',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7891',
        password: 'password',
        position: 'Barista',
        role: 'member',
        department: 'Operations',
    }
];

export const shifts: Shift[] = [];

export const leave: Leave[] = [];


export const weekDays: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getEmployeeById = (id: string | null) => {
  if (!id) return null;
  // This function will now be less effective as the static array is empty,
  // but the app passes the live employee list as props where needed.
  return employees.find(e => e.id === id);
};
