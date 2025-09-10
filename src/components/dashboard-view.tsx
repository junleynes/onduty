

'use client';

import React, { useEffect, useState } from 'react';
import type { NavItemKey, RolePermissions, UserRole, Employee } from '@/types';
import { Button } from './ui/button';
import { CalendarDays, ClipboardCheck, Clock, Users } from 'lucide-react';
import type { NavItem } from '@/app/page';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getBackgroundColor, getFullName, getInitials } from '@/lib/utils';

const iconMap: Record<string, { icon: React.ElementType, color: string }> = {
    'my-tasks': { icon: ClipboardCheck, color: 'bg-green-100 text-green-700' },
    'onduty': { icon: Clock, color: 'bg-blue-100 text-blue-700' },
    'team': { icon: Users, color: 'bg-purple-100 text-purple-700' },
    'my-schedule': { icon: CalendarDays, color: 'bg-orange-100 text-orange-700' },
};

const QUICK_LINKS: { view: NavItemKey; label: string; }[] = [
    { view: 'my-tasks', label: 'Quick Tasks' },
    { view: 'onduty', label: 'Time Clock' },
    { view: 'team', label: 'Directory' },
    { view: 'my-schedule', label: 'Schedule' },
];

type DashboardViewProps = {
  onNavigate: (view: NavItem) => void;
  permissions: RolePermissions;
  role: UserRole;
  currentUser: Employee;
};

export default function DashboardView({ onNavigate, permissions, role, currentUser }: DashboardViewProps) {
  const allowedViews = new Set(permissions[role] || []);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const availableLinks = QUICK_LINKS.filter(link => allowedViews.has(link.view));

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-4">
      <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
        <AvatarImage src={currentUser.avatar} data-ai-hint="profile avatar" />
        <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(currentUser)) }} className="text-4xl font-bold">
            {getInitials(getFullName(currentUser))}
        </AvatarFallback>
      </Avatar>

      <h1 className="text-3xl font-bold tracking-tight">
        {greeting}, {currentUser.firstName}! 👋
      </h1>

      <div className="flex items-center justify-center gap-4 sm:gap-8 w-full max-w-md">
        {availableLinks.map(({ view, label }) => {
            const Icon = iconMap[view]?.icon || ClipboardCheck;
            const colors = iconMap[view]?.color || 'bg-gray-100 text-gray-700';
            return (
                <button 
                    key={view} 
                    onClick={() => onNavigate(view)}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className={`flex items-center justify-center h-16 w-16 rounded-full transition-all group-hover:shadow-lg group-hover:scale-110 ${colors}`}>
                        <Icon className="h-8 w-8" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                </button>
            )
        })}
      </div>
    </div>
  );
}
