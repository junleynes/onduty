'use client';

import React, { useState, useMemo } from 'react';
import type { UserRole } from '@/types';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';

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
        return <ScheduleView />;
      case 'team':
        return role === 'admin' ? <TeamView /> : null;
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
  }, [activeView, role]);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarNav role={role} activeView={activeView} onNavigate={handleNavigate} />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen bg-background">
          <Header currentRole={role} onRoleChange={handleRoleChange} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {currentView}
          </main>
        </div>
      </SidebarInset>
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
