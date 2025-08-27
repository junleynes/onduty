
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
import AdminPanel from '@/components/admin-panel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TeamEditor } from '@/components/team-editor';
import { MemberImporter } from '@/components/member-importer';
import { useToast } from '@/hooks/use-toast';


export type NavItem = 'schedule' | 'team' | 'my-schedule' | 'availability' | 'admin';

function AppContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [leave, setLeave] = useState<Leave[]>(initialLeave);
  
  const [activeView, setActiveView] = useState<NavItem>('schedule');
  
  // State for modals, lifted up from TeamView and AdminPanel
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);


  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const user: Employee = JSON.parse(storedUser);
        // Ensure the current user in state is up-to-date with the main employees list
        const updatedUser = employees.find(emp => emp.id === user.id);
        if (updatedUser) {
            setCurrentUser(updatedUser);
            if (updatedUser.role === 'admin') {
                setActiveView('admin');
            } else if (updatedUser.role === 'manager') {
                setActiveView('schedule');
            } else {
                setActiveView('my-schedule');
            }
        } else {
             // If user not found (e.g. deleted), log them out
            handleLogout();
        }
    } else {
      router.push('/login');
    }
  }, [router, employees]);
  
  const role: UserRole = currentUser?.role || 'member';

  const handleNavigate = (view: NavItem) => {
    setActiveView(view);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    router.push('/login');
  }

  // Password reset for the logged-in user
  const handleOpenPasswordEditor = () => {
    setEditingEmployee(currentUser);
    setIsPasswordResetMode(true);
    setIsEditorOpen(true);
  }

  // CRUD handlers for employees, to be passed to AdminPanel and TeamView
  const handleAddMember = () => {
    setEditingEmployee({});
    setIsPasswordResetMode(false);
    setIsEditorOpen(true);
  };

  const handleEditMember = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsPasswordResetMode(false);
    setIsEditorOpen(true);
  };
  
  const handleResetPassword = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsPasswordResetMode(true);
    setIsEditorOpen(true);
  };

  const handleDeleteMember = (employeeId: string) => {
    setEmployees(employees.filter(emp => emp.id !== employeeId));
    toast({ title: 'Team Member Removed', variant: 'destructive' });
  };

  const handleSaveMember = (employeeData: Partial<Employee>) => {
    if (employeeData.id) {
      // Update existing employee
      setEmployees(employees.map(emp => (emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp)));
      toast({ title: isPasswordResetMode ? 'Password Reset Successfully' : 'Member Updated' });
    } else {
      // Add new employee
      const newEmployee: Employee = {
        ...employeeData,
        id: `emp-${Date.now()}`,
        avatar: employeeData.avatar || '',
        position: employeeData.position || '',
        role: employeeData.role || 'member',
      } as Employee;
      setEmployees([...employees, newEmployee]);
      toast({ title: 'Member Added' });
    }
     // Also update the currentUser in localStorage if they are editing their own data
     if (currentUser?.id === employeeData.id) {
        const updatedUser = { ...currentUser, ...employeeData };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };
  
  const handleImportMembers = (newMembers: Partial<Employee>[]) => {
      const newEmployees: Employee[] = newMembers.map((member, index) => ({
        ...member,
        id: `emp-${Date.now()}-${index}`,
        avatar: member.avatar || '',
        position: member.position || '',
        role: 'member',
      } as Employee));

      setEmployees(prev => [...prev, ...newEmployees]);
      toast({ title: 'Import Successful', description: `${newEmployees.length} new members added.`})
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
            currentUser={currentUser}
          />
        );
      case 'team':
        return <TeamView employees={employees} currentUser={currentUser} onEditMember={handleEditMember} />;
      case 'my-schedule':
        return <MyScheduleView shifts={shifts} employeeId={currentUser.id} />;
      case 'availability':
        return <AvailabilityView />;
      case 'admin':
        return (
            <AdminPanel 
                users={employees} 
                setUsers={setEmployees} 
                onAddMember={handleAddMember}
                onEditMember={handleEditMember}
                onDeleteMember={handleDeleteMember}
                onImportMembers={() => setIsImporterOpen(true)}
            />
        );
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
  }, [activeView, employees, shifts, leave, currentUser]);

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
    
    <TeamEditor
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        employee={editingEmployee}
        onSave={handleSaveMember}
        isPasswordResetMode={isPasswordResetMode}
    />
    <MemberImporter
        isOpen={isImporterOpen}
        setIsOpen={setIsImporterOpen}
        onImport={handleImportMembers}
    />
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
