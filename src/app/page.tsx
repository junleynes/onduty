
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { UserRole, Employee, Shift, Leave } from '@/types';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import { employees as initialEmployees, shifts as initialShifts, leave as initialLeave } from '@/lib/data';
import { useRouter } from 'next/navigation';

// Views
import ScheduleView from '@/components/schedule-view';
import MyScheduleView from '@/components/my-schedule-view';
import AvailabilityView from '@/components/availability-view';
import TeamView from '@/components/team-view';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TeamEditor } from '@/components/team-editor';

export type NavItem = 'schedule' | 'team' | 'my-schedule' | 'availability';

function AppContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [leave, setLeave] = useState<Leave[]>(initialLeave);
  
  const [activeView, setActiveView] = useState<NavItem>('schedule');
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const user: Employee = JSON.parse(storedUser);
        // Ensure the current user in state is up-to-date with the main employees list
        const updatedUser = employees.find(emp => emp.id === user.id);
        if (updatedUser) {
            setCurrentUser(updatedUser);
            setActiveView(updatedUser.position === 'Manager' ? 'schedule' : 'my-schedule');
        } else {
             // If user not found (e.g. deleted), log them out
            handleLogout();
        }
    } else {
      router.push('/login');
    }
  }, [router, employees]);
  
  const role: UserRole = currentUser?.position === 'Manager' ? 'admin' : 'employee';

  const handleNavigate = (view: NavItem) => {
    setActiveView(view);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    router.push('/login');
  }

  const handleOpenPasswordEditor = () => {
    setIsPasswordEditorOpen(true);
  }

  const handleSavePassword = (employeeData: Partial<Employee>) => {
     if (employeeData.id) {
      setEmployees(employees.map(emp => (emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp)));
      // Also update the currentUser in localStorage if they are editing their own password
      if (currentUser?.id === employeeData.id) {
          const updatedUser = { ...currentUser, ...employeeData };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    }
    setIsPasswordEditorOpen(false);
  }

  const currentView = useMemo(() => {
    if (!currentUser) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Please wait while we check your login status.</p>
                </CardContent>
            </Card>
        )
    }

    switch (activeView) {
      case 'schedule':
        return (
          <ScheduleView 
            employees={employees} 
            shifts={shifts}
            setShifts={setShifts}
            leave={leave}
            setLeave={setLeave}
          />
        );
      case 'team':
        return role === 'admin' ? <TeamView employees={employees} setEmployees={setEmployees} /> : null;
      case 'my-schedule':
        return <MyScheduleView shifts={shifts} employeeId={currentUser.id} />;
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
                    <p>You are currently logged in as {currentUser.firstName}.</p>
                </CardContent>
            </Card>
        );
    }
  }, [activeView, role, employees, shifts, leave, currentUser]);

  if (!currentUser) {
      return null; // Or a loading spinner
  }


  return (
    <>
    <div className='flex h-screen w-full'>
      <Sidebar collapsible="icon">
        <SidebarNav role={role} activeView={activeView} onNavigate={handleNavigate} />
      </Sidebar>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header currentUser={currentUser} onLogout={handleLogout} onResetPassword={handleOpenPasswordEditor} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {currentView}
        </main>
      </div>
    </div>
    {isPasswordEditorOpen && (
        <TeamEditor
            isOpen={isPasswordEditorOpen}
            setIsOpen={setIsPasswordEditorOpen}
            employee={currentUser}
            onSave={handleSavePassword}
            isPasswordResetMode={true}
        />
    )}
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
