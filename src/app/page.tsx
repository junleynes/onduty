
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
import TeamView from '@/components/team-view';
import AdminPanel from '@/components/admin-panel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TeamEditor } from '@/components/team-editor';
import { MemberImporter } from '@/components/member-importer';
import { useToast } from '@/hooks/use-toast';
import { GroupEditor } from '@/components/group-editor';


export type NavItem = 'schedule' | 'team' | 'my-schedule' | 'admin';

// Helper function to get initial state from localStorage or defaults
const getInitialState = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item, (k, v) => {
            // Revive dates from string format
            if (['date', 'birthDate', 'startDate'].includes(k) && v) {
                const date = new Date(v);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return v;
        }) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
        return defaultValue;
    }
};


function AppContent() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>(() => getInitialState('employees', initialEmployees));
  const [shifts, setShifts] = useState<Shift[]>(() => getInitialState('shifts', initialShifts));
  const [leave, setLeave] = useState<Leave[]>(() => getInitialState('leave', initialLeave));
  const [groups, setGroups] = useState<string[]>(() => getInitialState('groups', ['Administration', 'Cashiers', 'Chefs', 'Baristas']));

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<NavItem>('schedule');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [editorContext, setEditorContext] = useState<'admin' | 'manager'>('manager');

  // Persist state to localStorage on change
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('leave', JSON.stringify(leave)); }, [leave]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('groups', JSON.stringify(groups)); }, [groups]);


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
    if (employeeData.id) {
      setEmployees(employees.map(emp => (emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp)));
      toast({ title: isPasswordResetMode ? 'Password Reset Successfully' : 'User Updated' });
    } else {
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
     if (currentUser?.id === employeeData.id) {
        const updatedUser = employees.find(e => e.id === employeeData.id);
        if (updatedUser) {
            const finalUser = {...updatedUser, ...employeeData};
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
        role: 'member',
        phone: member.phone || '',
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
      case 'schedule': {
        const scheduleEmployees = employees.filter(emp => emp.role !== 'admin' && emp.group === currentUser.group);
        return (
          <ScheduleView 
            employees={scheduleEmployees} 
            shifts={shifts}
            setShifts={setShifts}
            leave={leave}
            setLeave={setLeave}
            currentUser={currentUser}
          />
        );
      }
      case 'team': {
        const teamEmployees = employees.filter(emp => emp.role !== 'admin' && emp.group === currentUser.group);
        return <TeamView employees={teamEmployees} currentUser={currentUser} onEditMember={(emp) => handleEditMember(emp, 'manager')} />;
      }
      case 'my-schedule':
        return <MyScheduleView shifts={shifts} employeeId={currentUser.id} />;
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
  }, [activeView, employees, shifts, leave, currentUser, groups]);

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
        <Header currentUser={currentUser} onLogout={handleLogout} onEditProfile={handleOpenProfileEditor} onResetPassword={handleOpenPasswordEditor} />
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
