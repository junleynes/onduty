

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
    Mail,
    FileText,
    Plane,
    ShieldCheck,
    AlertTriangle,
    Home,
    Newspaper,
} from 'lucide-react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarContent, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import type { UserRole, RolePermissions } from '@/types';
import type { NavItem } from '@/app/page';

interface SidebarNavProps {
  role: UserRole;
  activeView: NavItem;
  onNavigate: (view: NavItem) => void;
  permissions: RolePermissions;
}

type NavItemConfig = {
    view: NavItem;
    label: string;
    icon: LucideIcon;
    iconColor: string;
};

type NavGroup = {
    label: string;
    items: NavItemConfig[];
};

const allNavItems: Record<string, NavGroup[]> = {
    all: [
         {
            label: 'Home',
            items: [
                { view: 'dashboard', label: 'Dashboard', icon: Home, iconColor: 'bg-blue-500' },
            ]
        },
        {
            label: 'Overview',
            items: [
                { view: 'my-schedule', label: 'My Schedule', icon: Calendar, iconColor: 'bg-blue-500' },
                { view: 'my-tasks', label: 'My Shift Tasks', icon: ClipboardCheck, iconColor: 'bg-green-500' },
            ]
        },
         {
            label: 'Communication',
            items: [
                { view: 'news-feeds', label: 'News Feeds', icon: Newspaper, iconColor: 'bg-cyan-500' },
                { view: 'chat', label: 'Chat', icon: MessageSquare, iconColor: 'bg-emerald-500' },
            ]
        },
        {
            label: 'Operations',
            items: [
                { view: 'schedule', label: 'Schedule', icon: CalendarDays, iconColor: 'bg-orange-500' },
                { view: 'onduty', label: 'On Duty', icon: Clock, iconColor: 'bg-indigo-500' },
                { view: 'time-off', label: 'Time Off', icon: Plane, iconColor: 'bg-blue-500' },
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
        {
            label: 'Reports',
            items: [
                { view: 'reports', label: 'Reports', icon: FileText, iconColor: 'bg-gray-500' },
            ]
        },
        {
            label: 'Admin',
            items: [
                { view: 'admin', label: 'Users and Groups', icon: Shield, iconColor: 'bg-red-500' },
                { view: 'permissions', label: 'Permissions', icon: ShieldCheck, iconColor: 'bg-red-500' },
                { view: 'smtp-settings', label: 'SMTP Settings', icon: Mail, iconColor: 'bg-gray-500' },
                { view: 'danger-zone', label: 'Danger Zone', icon: AlertTriangle, iconColor: 'bg-destructive' },
            ]
        }
    ]
};

export default function SidebarNav({ role, activeView, onNavigate, permissions }: SidebarNavProps) {
    const adminOnlyViews = new Set(['admin', 'permissions', 'smtp-settings', 'danger-zone']);
    
    if (role === 'admin') {
        const adminNavGroups = allNavItems.all.filter(group => group.label === 'Admin');
        return (
             <div className="flex flex-col h-full text-sidebar-foreground">
                <SidebarContent>
                    <SidebarMenu className="flex-1 px-2">
                        {adminNavGroups.map((group) => (
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
                </SidebarContent>
                 <SidebarFooter>
                    <SidebarTrigger className="m-auto" />
                </SidebarFooter>
            </div>
        );
    }
    
    const allowedViews = new Set(permissions[role] || []);
    // Ensure dashboard is always available for non-admins
    allowedViews.add('dashboard');


    const navGroups = allNavItems.all.map(group => ({
      ...group,
      items: group.items.filter(item => allowedViews.has(item.view) && !adminOnlyViews.has(item.view))
    })).filter(group => group.items.length > 0);


  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <SidebarContent>
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
      </SidebarContent>
       <SidebarFooter>
            <SidebarTrigger className="m-auto" />
        </SidebarFooter>
    </div>
  );
}
