
'use client';
import { 
    CalendarDays, 
    Users, 
    Calendar, 
    Shield, 
    type LucideIcon, 
    GitMerge, 
    Gift, 
    PartyPopper, 
    Clock, 
    ClipboardCheck, 
    LayoutGrid,
    List,
    Contact,
    MessageSquare,
    Headphones,
    ClipboardList,
    PlusCircle,
    Smartphone,
    ListChecks,
    Mail
} from 'lucide-react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import type { UserRole } from '@/types';
import type { NavItem } from '@/app/page';

interface SidebarNavProps {
  role: UserRole;
  activeView: NavItem;
  onNavigate: (view: NavItem) => void;
}

type NavGroup = {
    label: string;
    items: {
        view: NavItem;
        label: string;
        icon: LucideIcon;
        iconColor: string;
    }[];
};

const navConfig: { [key in UserRole]: NavGroup[] } = {
    admin: [{
        label: 'Admin',
        items: [
            { view: 'admin', label: 'Admin Panel', icon: Shield, iconColor: 'bg-red-500' },
            { view: 'smtp-settings', label: 'SMTP Settings', icon: Mail, iconColor: 'bg-gray-500' },
        ]
    }],
    manager: [
        {
            label: 'Overview',
            items: [
                { view: 'my-schedule', label: 'My Schedule', icon: Calendar, iconColor: 'bg-blue-500' },
                { view: 'my-tasks', label: 'My Shift Tasks', icon: ClipboardCheck, iconColor: 'bg-green-500' },
            ]
        },
        {
            label: 'Operations',
            items: [
                { view: 'schedule', label: 'Schedule', icon: CalendarDays, iconColor: 'bg-orange-500' },
                { view: 'onduty', label: 'On Duty', icon: Clock, iconColor: 'bg-indigo-500' },
                { view: 'allowance', label: 'Mobile Load', icon: Smartphone, iconColor: 'bg-teal-500' },
                { view: 'task-manager', label: 'Task Manager', icon: ListChecks, iconColor: 'bg-indigo-500' },
            ]
        },
        {
            label: 'People',
            items: [
                { view: 'team', label: 'Team', icon: Users, iconColor: 'bg-sky-500' },
                { view: 'org-chart', label: 'Org Chart', icon: GitMerge, iconColor: 'bg-purple-500' },
                { view: 'celebrations', label: 'Celebrations', icon: Gift, iconColor: 'bg-pink-500' },
                { view: 'holidays', label: 'Holidays', icon: PartyPopper, iconColor: 'bg-yellow-500' },
            ]
        },
    ],
    member: [
         {
            label: 'Overview',
            items: [
                { view: 'my-schedule', label: 'My Schedule', icon: Calendar, iconColor: 'bg-blue-500' },
                { view: 'my-tasks', label: 'My Shift Tasks', icon: ClipboardCheck, iconColor: 'bg-green-500' },
            ]
        },
        {
            label: 'Operations',
            items: [
                { view: 'schedule', label: 'Schedule', icon: CalendarDays, iconColor: 'bg-orange-500' },
                { view: 'onduty', label: 'On Duty', icon: Clock, iconColor: 'bg-indigo-500' },
                 { view: 'allowance', label: 'Mobile Load', icon: Smartphone, iconColor: 'bg-teal-500' },
                 { view: 'task-manager', label: 'Task Manager', icon: ListChecks, iconColor: 'bg-indigo-500' },
            ]
        },
        {
            label: 'People',
            items: [
                { view: 'team', label: 'Team', icon: Users, iconColor: 'bg-sky-500' },
                { view: 'org-chart', label: 'Org Chart', icon: GitMerge, iconColor: 'bg-purple-500' },
                { view: 'celebrations', label: 'Celebrations', icon: Gift, iconColor: 'bg-pink-500' },
                { view: 'holidays', label: 'Holidays', icon: PartyPopper, iconColor: 'bg-yellow-500' },
            ]
        },
    ]
};

export default function SidebarNav({ role, activeView, onNavigate }: SidebarNavProps) {
  const navGroups = navConfig[role] || navConfig.member;

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <SidebarMenu className="flex-1 px-2">
        {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                {group.items.map(({ view, label, icon: Icon, iconColor }) => (
                <SidebarMenuItem key={view}>
                    <SidebarMenuButton
                    onClick={() => onNavigate(view)}
                    isActive={activeView === view}
                    className="justify-start gap-3"
                    tooltip={label}
                    >
                    <div className={`p-1.5 rounded-md text-white ${iconColor}`}>
                        <Icon className="size-4" />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">{label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                ))}
            </SidebarGroup>
        ))}
      </SidebarMenu>
    </div>
  );
}
