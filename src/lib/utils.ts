import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Employee } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullName(employee: Partial<Employee | null>): string {
    if (!employee) return '';
    return [employee.firstName, employee.middleInitial, employee.lastName].filter(Boolean).join(' ');
}

export function getInitials(name: string) {
  const names = name.split(' ');
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
