
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { UserRole, Employee, Shift, Leave, Notification } from '@/types';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import { employees as initialEmployees, shifts as initialShifts, leave as initialLeave, initialGroups } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';
import { getInitialState } from '@/lib/utils';

// Views
import ScheduleView from '@/components/schedule-view';
import MyScheduleView from '@/components/my-schedule-view';
import TeamView from '@/components/team-view';
import AdminPanel from '@/components/admin-panel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TeamEditor } from '@/components/team-editor';
import { MemberImporter } from '@/components/member-importer';
import { useToast } from '@/hooks/use-toast';
import { GroupEditor } from '@/components/group-editor';


export type NavItem = 'schedule' | 'team' | 'my-schedule' | 'admin';


function AppContent() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>(() => getInitialState('employees', initialEmployees));
  const [shifts, setShifts] = useState<Shift[]>(() => getInitialState('shifts', initialShifts));
  const [leave, setLeave] = useState<Leave[]>(() => getInitialState('leave', initialLeave));
  const [groups, setGroups] = useState<string[]>(() => getInitialState('groups', initialGroups));

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<NavItem>('schedule');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [editorContext, setEditorContext] = useState<'admin' | 'manager'>('manager');

  const { notifications, setNotifications, addNotification } = useNotifications();

  // Persist state to localStorage on change
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('leave', JSON.stringify(leave)); }, [leave]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('groups', JSON.stringify(groups)); }, [groups]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);


  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const user: Employee = JSON.parse(storedUser);
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
            handleLogout();
        }
    } else {
      router.push('/login');
    }
  }, [router, employees]);
  
  const role: UserRole = currentUser?.role || 'member';

  const shiftsForView = useMemo(() => {
    if (currentUser?.role === 'member') {
      return shifts.filter(shift => shift.status === 'published');
    }
    return shifts;
  }, [shifts, currentUser]);

  const handleNavigate = (view: NavItem) => {
    setActiveView(view);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    router.push('/login');
  }

  const handleOpenProfileEditor = () => {
    setEditingEmployee(currentUser);
    setIsPasswordResetMode(false);
    setEditorContext(currentUser?.role === 'admin' ? 'admin' : 'manager'); 
    setIsEditorOpen(true);
  }

  const handleOpenPasswordEditor = () => {
    setEditingEmployee(currentUser);
    setIsPasswordResetMode(true);
    setEditorContext('manager'); 
    setIsEditorOpen(true);
  }

  const handleAddMember = (context: 'admin' | 'manager') => {
    setEditingEmployee({});
    setIsPasswordResetMode(false);
    setEditorContext(context);
    setIsEditorOpen(true);
  };

  const handleEditMember = (employee: Employee, context: 'admin' | 'manager') => {
    setEditingEmployee(employee);
    setIsPasswordResetMode(false);
    setEditorContext(context);
    setIsEditorOpen(true);
  };
  
  const handleResetPassword = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsPasswordResetMode(true);
    setEditorContext('manager');
    setIsEditorOpen(true);
  };

  const handleDeleteMember = (employeeId: string) => {
    setEmployees(employees.filter(emp => emp.id !== employeeId));
    toast({ title: 'User Removed', variant: 'destructive' });
  };

  const handleSaveMember = (employeeData: Partial<Employee>) => {
    // Check if adding a new user or editing an existing one
    if (employeeData.id) {
        // This is a direct edit of an existing user
        setEmployees(employees.map(emp => (emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp)));
        toast({ title: isPasswordResetMode ? 'Password Reset Successfully' : 'User Updated' });
    } else {
        // This is a new user submission, check for email duplication
        const existingEmployeeByEmail = employees.find(emp => emp.email.toLowerCase() === employeeData.email?.toLowerCase());

        if (existingEmployeeByEmail) {
            // Email exists, overwrite the existing user's data
            setEmployees(employees.map(emp =>
                emp.id === existingEmployeeByEmail.id
                    ? { ...emp, ...employeeData, id: emp.id } as Employee // Ensure ID is preserved
                    : emp
            ));
            toast({ title: 'User Updated', description: 'An existing user with this email was updated.' });
        } else {
            // Email is new, create a new user
            const newEmployee: Employee = {
                ...employeeData,
                id: `emp-${Date.now()}`,
                avatar: employeeData.avatar || '',
                position: employeeData.position || '',
                role: employeeData.role || 'member',
                phone: employeeData.phone || '',
            } as Employee;
            setEmployees([...employees, newEmployee]);
            toast({ title: 'User Added' });
        }
    }

    // Update current user if their own data was changed
    if (currentUser?.id === employeeData.id) {
        const updatedUser = employees.find(e => e.id === employeeData.id);
        if (updatedUser) {
            const finalUser = { ...updatedUser, ...employeeData };
            setCurrentUser(finalUser as Employee);
            localStorage.setItem('currentUser', JSON.stringify(finalUser));
        }
    }
  };
  
  const handleImportMembers = (newMembers: Partial<Employee>[]) => {
      const newEmployees: Employee[] = newMembers.map((member, index) => ({
        ...member,
        id: `emp-${Date.now()}-${index}`,
        avatar: member.avatar || '',
        position: member.position || '',
        role: member.role || 'member',
        phone: member.phone || '',
      } as Employee));

      setEmployees(prev => [...prev, ...newEmployees]);
      toast({ title: 'Import Successful', description: `${newEmployees.length} new members added.`})
  }

  const handlePublish = () => {
    setShifts(currentShifts => 
        currentShifts.map(shift => ({...shift, status: 'published' }))
    );
    addNotification({ message: 'The schedule has been published.' });
    toast({ title: "Schedule Published!", description: "All shifts are now marked as published." });
  };


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
      case 'schedule': {
        const scheduleEmployees = employees.filter(emp => emp.role !== 'admin');
        return (
          <ScheduleView 
            employees={scheduleEmployees}
            setEmployees={setEmployees}
            shifts={shiftsForView}
            setShifts={setShifts}
            leave={leave}
            setLeave={setLeave}
            currentUser={currentUser}
            onPublish={handlePublish}
            addNotification={addNotification}
          />
        );
      }
      case 'team': {
        const teamEmployees = employees.filter(emp => emp.role !== 'admin' && emp.group === currentUser.group);
        return <TeamView employees={teamEmployees} currentUser={currentUser} onEditMember={(emp) => handleEditMember(emp, 'manager')} />;
      }
      case 'my-schedule':
        return <MyScheduleView shifts={shiftsForView} employeeId={currentUser.id} employees={employees} />;
      case 'admin':
        return (
            <AdminPanel 
                users={employees} 
                setUsers={setEmployees}
                groups={groups}
                onAddMember={() => handleAddMember('admin')}
                onEditMember={(emp) => handleEditMember(emp, 'admin')}
                onDeleteMember={handleDeleteMember}
                onImportMembers={() => setIsImporterOpen(true)}
                onManageGroups={() => setIsGroupEditorOpen(true)}
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
  }, [activeView, employees, shifts, leave, currentUser, groups, shiftsForView, addNotification, router, toast]);

  if (!currentUser) {
      return null;
  }


  return (
    <>
    <div className='flex h-screen w-full'>
      <Sidebar collapsible="icon">
        <SidebarNav role={role} activeView={activeView} onNavigate={handleNavigate} />
      </Sidebar>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onEditProfile={handleOpenProfileEditor} 
          onResetPassword={handleOpenPasswordEditor}
          notifications={notifications}
          setNotifications={setNotifications}
        />
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
        context={editorContext}
        groups={groups}
        setGroups={setGroups}
    />
    <MemberImporter
        isOpen={isImporterOpen}
        setIsOpen={setIsImporterOpen}
        onImport={handleImportMembers}
    />
    <GroupEditor
        isOpen={isGroupEditorOpen}
        setIsOpen={setIsGroupEditorOpen}
        groups={groups}
        setGroups={setGroups}
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
