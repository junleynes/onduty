
'use client';

import React, { useState, useMemo } from 'react';
import type { UserRole, Employee } from '@/types';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { employees as initialEmployees } from '@/lib/data';

// Views
import ScheduleView from '@/components/schedule-view';
import MyScheduleView from '@/components/my-schedule-view';
import AvailabilityView from '@/components/availability-view';
import TeamView from '@/components/team-view';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export type NavItem = 'schedule' | 'team' | 'my-schedule' | 'availability';

function AppContent() {
  const [role, setRole] = useState<UserRole>('admin');
  const [activeView, setActiveView] = useState<NavItem>(role === 'admin' ? 'schedule' : 'my-schedule');
  const { isMobile } = useSidebar();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);


  const handleNavigate = (view: NavItem) => {
    setActiveView(view);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Reset to default view for the new role
    if (newRole === 'admin') {
      setActiveView('schedule');
    } else {
      setActiveView('my-schedule');
    }
  };

  const currentView = useMemo(() => {
    switch (activeView) {
      case 'schedule':
        return <ScheduleView employees={employees} />;
      case 'team':
        return role === 'admin' ? <TeamView employees={employees} setEmployees={setEmployees} /> : null;
      case 'my-schedule':
        return <MyScheduleView />;
      case 'availability':
        return <AvailabilityView />;
      default:
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to ShiftMaster</CardTitle>
                    <CardDescription>Select a view from the sidebar to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>You are currently in {role === 'admin' ? 'Admin' : 'Employee'} mode.</p>
                </CardContent>
            </Card>
        );
    }
  }, [activeView, role, employees]);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarNav role={role} activeView={activeView} onNavigate={handleNavigate} />
      </Sidebar>
      <div className="flex flex-col h-screen w-full">
        <Header currentRole={role} onRoleChange={handleRoleChange} />
        <SidebarInset>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {currentView}
            </main>
        </SidebarInset>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  );
}
