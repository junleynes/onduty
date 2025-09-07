

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NavItemKey, RolePermissions, UserRole } from '@/types';
import { Button } from './ui/button';
import { ArrowRight, Calendar, CalendarDays, ClipboardCheck, Clock, GitMerge, Home, Plane, Users, PartyPopper, Gift, FileText, Smartphone, ListChecks, Shield, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
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
    { view: 'schedule', label: 'Schedule', description: 'View and manage team schedules.' },
    { view: 'my-schedule', label: 'My Schedule', description: 'Check your upcoming shifts.' },
    { view: 'team', label: 'Team', description: 'See all members of your group.' },
    { view: 'time-off', label: 'Time Off', description: 'Request and manage leave.' },
    { view: 'my-tasks', label: 'My Tasks', description: 'Check your assigned shift tasks.' },
    { view: 'onduty', label: 'On Duty', description: 'See who is currently on shift.' },
    { view: 'org-chart', label: 'Org Chart', description: 'Visualize the team structure.' },
];

type DashboardViewProps = {
  onNavigate: (view: NavItem) => void;
  permissions: RolePermissions;
  role: UserRole;
};


export default function DashboardView({ onNavigate, permissions, role }: DashboardViewProps) {
  const allowedViews = new Set(permissions[role] || []);

  const availableLinks = QUICK_LINKS.filter(link => allowedViews.has(link.view));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to OnDuty</CardTitle>
          <CardDescription className="text-base">
            A modern, AI-powered solution for intelligent shift scheduling, team management, and operational efficiency. 
            Use the quick links below to get started.
          </CardDescription>
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
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-md text-white ${color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{label}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">{description}</p>
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
