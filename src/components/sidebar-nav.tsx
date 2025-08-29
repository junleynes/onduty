
'use client';
import { CalendarDays, Users, Calendar, Clock, Shield, type LucideIcon, GitMerge } from 'lucide-react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import type { UserRole } from '@/types';
import type { NavItem } from '@/app/page';

interface SidebarNavProps {
  role: UserRole;
  activeView: NavItem;
  onNavigate: (view: NavItem) => void;
}

const navConfig: { [key in UserRole]: { view: NavItem; label: string; icon: LucideIcon }[] } = {
    admin: [
        { view: 'admin', label: 'Admin Panel', icon: Shield },
    ],
    manager: [
        { view: 'my-schedule', label: 'My Schedule', icon: Calendar },
        { view: 'schedule', label: 'Schedule', icon: CalendarDays },
        { view: 'team', label: 'Team', icon: Users },
        { view: 'org-chart', label: 'Org Chart', icon: GitMerge },
    ],
    member: [
        { view: 'my-schedule', label: 'My Schedule', icon: Calendar },
        { view: 'schedule', label: 'Schedule', icon: CalendarDays },
        { view: 'team', label: 'Team', icon: Users },
        { view: 'org-chart', label: 'Org Chart', icon: GitMerge },
    ],
};

export default function SidebarNav({ role, activeView, onNavigate }: SidebarNavProps) {
  const navItems = navConfig[role] || navConfig.member;

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <SidebarHeader>
         <h2 className="text-lg font-semibold text-sidebar-foreground tracking-tight px-2 group-data-[collapsible=icon]:hidden">Navigation</h2>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {navItems.map(({ view, label, icon: Icon }) => (
          <SidebarMenuItem key={view}>
            <SidebarMenuButton
              onClick={() => onNavigate(view)}
              isActive={activeView === view}
              className="justify-start"
              tooltip={label}
            >
              <Icon className="size-4 text-primary" />
              <span className="group-data-[collapsible=icon]:hidden">{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
