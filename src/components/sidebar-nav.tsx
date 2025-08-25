'use client';
import { CalendarDays, Users, Calendar, Clock, ClipboardList, type LucideIcon } from 'lucide-react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import type { UserRole } from '@/types';
import type { NavItem } from '@/app/page';

interface SidebarNavProps {
  role: UserRole;
  activeView: NavItem;
  onNavigate: (view: NavItem) => void;
}

const adminNavItems: { view: NavItem; label: string; icon: LucideIcon }[] = [
  { view: 'schedule', label: 'Schedule', icon: CalendarDays },
  { view: 'team', label: 'Team', icon: Users },
  { view: 'templates', label: 'Templates', icon: ClipboardList },
];

const employeeNavItems: { view: NavItem; label: string; icon: LucideIcon }[] = [
  { view: 'my-schedule', label: 'My Schedule', icon: Calendar },
  { view: 'availability', label: 'My Availability', icon: Clock },
];

export default function SidebarNav({ role, activeView, onNavigate }: SidebarNavProps) {
  const navItems = role === 'admin' ? adminNavItems : employeeNavItems;

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
              <Icon className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
