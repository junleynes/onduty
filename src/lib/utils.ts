import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.slice(0, 2).toUpperCase();
}

export function getBackgroundColor(name: string) {
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', 
        '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
    ];
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const index = charCodeSum % colors.length;
    return colors[index];
}
