
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Employee } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullName(employee: Partial<Employee | null>): string {
    if (!employee) return '';
    const parts: string[] = [];
    if (employee.firstName) parts.push(employee.firstName);
    if (employee.middleInitial) parts.push(employee.middleInitial);
    if (employee.lastName) parts.push(employee.lastName);
    return parts.join(' ');
}

export function getInitials(name: string) {
  if (!name) return '';
  const names = name.trim().split(' ').filter(Boolean);
  if (names.length === 0) return '';
  const first = names[0]?.[0] || '';
  const last = names.length > 1 ? names[names.length - 1]?.[0] : '';
  return (first + last).toUpperCase();
}

export function getBackgroundColor(name: string) {
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', 
        '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
    ];
    if (!name) return colors[0];
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const index = charCodeSum % colors.length;
    return colors[index];
}

// Helper function to get initial state from localStorage or defaults
export const getInitialState = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        
        // Special handling for the raw template string to avoid JSON parsing
        if (key === 'attendanceSheetTemplate') {
            return (item || defaultValue) as T;
        }

        // A more robust date reviver that handles UTC dates correctly
        const dateReviver = (k: string, v: any) => {
            if (['date', 'birthDate', 'startDate', 'timestamp', 'completedAt', 'dueDate', 'asOfDate'].includes(k) && typeof v === 'string') {
                // Regex to check for ISO 8601 date format (YYYY-MM-DDTHH:mm:ss.sssZ)
                const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
                if (isoDateRegex.test(v)) {
                    const date = new Date(v);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }
            return v;
        };
        return item ? JSON.parse(item, dateReviver) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
        return defaultValue;
    }
};

const normalizeName = (name: string): string => {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
};

export const findEmployeeByName = (name: string, allEmployees: Employee[]): Employee | null => {
  if (!name || typeof name !== 'string') return null;

  const normalizedInput = normalizeName(name);

  // Exact match first
  for (const emp of allEmployees) {
    const fullName = normalizeName(`${emp.firstName} ${emp.lastName}`);
    const fullNameWithMI = normalizeName(`${emp.firstName} ${emp.middleInitial || ''} ${emp.lastName}`);
    if (fullName === normalizedInput || fullNameWithMI === normalizedInput) {
      return emp;
    }
  }

  // Handle "Lastname, Firstname M.I. Suffix"
  if (name.includes(',')) {
    const parts = name.split(',').map(p => p.trim());
    const lastNamePart = normalizeName(parts[0]);
    const firstNamePart = normalizeName(parts[1] || '');

    for (const emp of allEmployees) {
      const normalizedEmpLastName = normalizeName(emp.lastName);
      const normalizedEmpFirstName = normalizeName(emp.firstName);
      if (normalizedEmpLastName === lastNamePart && firstNamePart.startsWith(normalizedEmpFirstName)) {
        return emp;
      }
    }
  }

  return null;
};
