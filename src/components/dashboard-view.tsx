

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NavItemKey, RolePermissions, UserRole, Employee } from '@/types';
import { Button } from './ui/button';
import { ArrowRight, Calendar, CalendarDays, ClipboardCheck, Clock, GitMerge, Home, Plane, Users, PartyPopper, Gift, FileText, Smartphone, ListChecks, Shield, ShieldCheck, Mail, AlertTriangle, HelpCircle } from 'lucide-react';
import type { NavItem } from '@/app/page';

const iconMap: Record<NavItemKey, { icon: React.ElementType, color: string }> = {
    dashboard: { icon: Home, color: 'bg-blue-500' },
    'my-schedule': { icon: Calendar, color: 'bg-blue-500' },
    'my-tasks': { icon: ClipboardCheck, color: 'bg-green-500' },
    schedule: { icon: CalendarDays, color: 'bg-orange-500' },
    onduty: { icon: Clock, color: 'bg-indigo-500' },
    'time-off': { icon: Plane, color: 'bg-blue-500' },
    allowance: { icon: Smartphone, color: 'bg-teal-500' },
    'task-manager': { icon: ListChecks, color: 'bg-indigo-500' },
    team: { icon: Users, color: 'bg-sky-500' },
    'org-chart': { icon: GitMerge, color: 'bg-purple-500' },
    celebrations: { icon: Gift, color: 'bg-pink-500' },
    holidays: { icon: PartyPopper, color: 'bg-yellow-500' },
    reports: { icon: FileText, color: 'bg-gray-500' },
    faq: { icon: HelpCircle, color: 'bg-cyan-500' },
    admin: { icon: Shield, color: 'bg-red-500' },
    permissions: { icon: ShieldCheck, color: 'bg-red-500' },
    'smtp-settings': { icon: Mail, color: 'bg-gray-500' },
    'danger-zone': { icon: AlertTriangle, color: 'bg-destructive' },
    'report-work-schedule': { icon: FileText, color: 'bg-gray-500'},
    'report-attendance': { icon: FileText, color: 'bg-gray-500'},
    'report-user-summary': { icon: FileText, color: 'bg-gray-500'},
    'report-tardy': { icon: FileText, color: 'bg-gray-500'},
    'report-wfh': { icon: FileText, color: 'bg-gray-500'},
    'report-work-extension':{ icon: FileText, color: 'bg-gray-500'},
    'report-overtime':{ icon: FileText, color: 'bg-gray-500'},
};


const QUICK_LINKS: { view: NavItemKey; label: string; description: string; }[] = [
    { view: 'my-schedule', label: 'My Schedule', description: 'Check your upcoming shifts.' },
    { view: 'my-tasks', label: 'My Tasks', description: 'Check your assigned shift tasks.' },
    { view: 'team', label: 'Team', description: 'See all members of your group.' },
    { view: 'time-off', label: 'Time Off', description: 'Request and manage leave.' },
    { view: 'onduty', label: 'On Duty', description: 'See who is currently on shift.' },
    { view: 'celebrations', label: 'Celebrations', description: 'View upcoming birthdays and anniversaries.' },
    { view: 'holidays', label: 'Holidays', description: 'Check the official company holiday list.' },
    { view: 'allowance', label: 'Mobile Load', description: 'Manage your mobile allowance.' },
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{greeting}, {currentUser.firstName}!</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Navigate to the most common sections of the application.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {availableLinks.map(({ view, label, description }) => {
                    const Icon = iconMap[view].icon;
                    const color = iconMap[view].color;
                    return (
                        <button 
                            key={view} 
                            onClick={() => onNavigate(view)}
                            className="group text-left p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all flex flex-col justify-between h-full shadow-sm hover:shadow-md"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className={`p-2 rounded-md text-white ${color} w-full h-32 flex items-center justify-center mb-4`}>
                                    <Icon className="w-[90%] h-[90%]" />
                                </div>
                                <h3 className="text-lg font-semibold">{label}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            </div>
                            <div className="flex items-center justify-end text-sm font-medium text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                Go <ArrowRight className="h-4 w-4 ml-1" />
                            </div>
                        </button>
                    )
                })}
            </div>
             {availableLinks.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    <p>No quick links available based on your permissions.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
