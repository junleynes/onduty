
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { UserRole, Employee, Shift, Leave, Notification, Note, Holiday, Task, CommunicationAllowance, SmtpSettings } from '@/types';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import { employees as initialEmployees, shifts as initialShifts, leave as initialLeave, initialGroups, initialNotes, initialHolidays, initialTasks, communicationAllowances as initialAllowance, initialSmtpSettings } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';
import { getInitialState } from '@/lib/utils';
import { isSameDay, getMonth, getDate, getYear, format } from 'date-fns';


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
import OrgChartView from '@/components/org-chart-view';
import CelebrationsView from '@/components/celebrations-view';
import { NoteViewer } from '@/components/note-viewer';
import { NoteEditor } from '@/components/note-editor';
import { HolidayEditor } from '@/components/holiday-editor';
import HolidaysView from '@/components/holidays-view';
import OndutyView from '@/components/onduty-view';
import MyTasksView from '@/components/my-tasks-view';
import AllowanceView from '@/components/allowance-view';
import TaskManagerView from '@/components/task-manager-view';
import { SmtpSettingsDialog } from '@/components/smtp-settings-dialog';


export type NavItem = 'schedule' | 'team' | 'my-schedule' | 'admin' | 'org-chart' | 'celebrations' | 'holidays' | 'onduty' | 'my-tasks' | 'allowance' | 'task-manager';


function AppContent() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>(() => getInitialState('employees', initialEmployees));
  const [shifts, setShifts] = useState<Shift[]>(() => getInitialState('shifts', initialShifts));
  const [leave, setLeave] = useState<Leave[]>(() => getInitialState('leave', initialLeave));
  const [groups, setGroups] = useState<string[]>(() => getInitialState('groups', initialGroups));
  const [notes, setNotes] = useState<Note[]>(() => getInitialState('notes', initialNotes));
  const [holidays, setHolidays] = useState<Holiday[]>(() => getInitialState('holidays', initialHolidays));
  const [tasks, setTasks] = useState<Task[]>(() => getInitialState('tasks', initialTasks));
  const [allowances, setAllowances] = useState<CommunicationAllowance[]>(() => getInitialState('communicationAllowances', initialAllowance));
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(() => getInitialState('smtpSettings', initialSmtpSettings));


  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<NavItem>('schedule');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  const [isHolidayEditorOpen, setIsHolidayEditorOpen] = useState(false);
  const [isSmtpSettingsOpen, setIsSmtpSettingsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [editorContext, setEditorContext] = useState<'admin' | 'manager'>('manager');

  const [isNoteViewerOpen, setIsNoteViewerOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | Holiday | null>(null);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);


  const { notifications, setNotifications, addNotification, addNotificationForUser } = useNotifications();

  // Persist state to localStorage on change
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('leave', JSON.stringify(leave)); }, [leave]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('groups', JSON.stringify(groups)); }, [groups]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('holidays', JSON.stringify(holidays)); }, [holidays]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('communicationAllowances', JSON.stringify(allowances)); }, [allowances]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('smtpSettings', JSON.stringify(smtpSettings)); }, [smtpSettings]);



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
  }, [router]);
  
  const role: UserRole = currentUser?.role || 'member';
  
  // Effect for sending celebration notifications
    useEffect(() => {
        if (!employees.length || !currentUser) return;

        const today = new Date();
        const storageKey = `celebrations-notified-${format(today, 'yyyy-MM-dd')}`;
        const notifiedToday: string[] = getInitialState(storageKey, []);

        const celebrationsToNotify: { employee: Employee; type: 'birthday' | 'anniversary' }[] = [];

        employees.forEach(employee => {
            // Check for birthday
            if (employee.birthDate) {
                const birthDate = new Date(employee.birthDate);
                if (getMonth(birthDate) === getMonth(today) && getDate(birthDate) === getMonth(today)) {
                    if (!notifiedToday.includes(`${employee.id}-birthday`)) {
                        celebrationsToNotify.push({ employee, type: 'birthday' });
                    }
                }
            }
            // Check for anniversary
            if (employee.startDate) {
                const startDate = new Date(employee.startDate);
                if (getYear(startDate) !== getYear(today) && getMonth(startDate) === getMonth(today) && getDate(startDate) === getMonth(today)) {
                     if (!notifiedToday.includes(`${employee.id}-anniversary`)) {
                        celebrationsToNotify.push({ employee, type: 'anniversary' });
                    }
                }
            }
        });

        if (celebrationsToNotify.length > 0) {
            const newNotified = [...notifiedToday];
            let notificationsAdded = false;

            celebrationsToNotify.forEach(({ employee, type }) => {
                const employeeGroup = employee.group;
                if (!employeeGroup) return;

                const membersInGroup = employees.filter(e => e.group === employeeGroup);
                const message = type === 'birthday'
                    ? `It's ${employee.firstName} ${employee.lastName}'s birthday today! Wish them well.`
                    : `It's ${employee.firstName} ${employee.lastName}'s work anniversary today!`;
                
                membersInGroup.forEach(member => {
                    addNotificationForUser({ message, employeeId: member.id, link: '/celebrations' });
                });
                newNotified.push(`${employee.id}-${type}`);
                notificationsAdded = true;
            });
            
            if (notificationsAdded) {
                 if (typeof window !== 'undefined') {
                    localStorage.setItem(storageKey, JSON.stringify(newNotified));
                }
            }
        }
    }, [employees, addNotificationForUser, currentUser]);

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
    // Also remove all associated data
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    
    const shiftsForEmployee = shifts.filter(s => s.employeeId === employeeId);
    const shiftIdsForEmployee = new Set(shiftsForEmployee.map(s => s.id));

    setShifts(prev => prev.filter(s => s.employeeId !== employeeId));
    setLeave(prev => prev.filter(l => l.employeeId !== employeeId));
    setTasks(prev => prev.filter(t => (t.shiftId && shiftIdsForEmployee.has(t.shiftId)) || t.assigneeId === employeeId));
    setAllowances(prev => prev.filter(a => a.employeeId !== employeeId));

    toast({ title: 'User Removed', description: 'All associated shifts, tasks, and allowances have been removed.', variant: 'destructive' });
  };
  
  const handleBatchDeleteMembers = (employeeIds: string[]) => {
    const idsToDelete = new Set(employeeIds);
    setEmployees(prev => prev.filter(emp => !idsToDelete.has(emp.id)));

    const shiftsForEmployees = shifts.filter(s => s.employeeId && idsToDelete.has(s.employeeId));
    const shiftIdsForEmployees = new Set(shiftsForEmployees.map(s => s.id));
    
    setShifts(prev => prev.filter(s => !s.employeeId || !idsToDelete.has(s.employeeId)));
    setLeave(prev => prev.filter(l => !idsToDelete.has(l.employeeId)));
    setTasks(prev => prev.filter(t => 
        !(t.shiftId && shiftIdsForEmployees.has(t.shiftId)) && 
        !(t.assigneeId && idsToDelete.has(t.assigneeId))
    ));
    setAllowances(prev => prev.filter(a => !idsToDelete.has(a.employeeId)));

    toast({ title: `${employeeIds.length} Users Removed`, description: 'All associated data has been removed.', variant: 'destructive' });
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
  
  const handleEditNote = (note: Partial<Note>) => {
    setEditingNote(note);
    setIsNoteEditorOpen(true);
  };
  
  const handleSaveNote = (savedNote: Note | Partial<Note>) => {
    if (currentUser?.role === 'member') return;
    if (savedNote.id) {
        setNotes(notes.map(n => n.id === savedNote.id ? savedNote as Note : n));
        toast({ title: 'Note Updated' });
    } else {
        const newNoteWithId = { ...savedNote, id: `note-${Date.now()}` } as Note;
        setNotes([...notes, newNoteWithId]);
        toast({ title: 'Note Added' });
    }
    setIsNoteEditorOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    if (currentUser?.role === 'member') return;
    setNotes(notes.filter(n => n.id !== noteId));
    setIsNoteEditorOpen(false);
    setEditingNote(null);
    toast({ title: 'Note Deleted', variant: 'destructive' });
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
            notes={notes}
            setNotes={setNotes}
            holidays={holidays}
            setHolidays={setHolidays}
            tasks={tasks}
            setTasks={setTasks}
            currentUser={currentUser}
            onPublish={handlePublish}
            addNotification={addNotification}
            onViewNote={(note) => {
              setViewingNote(note);
              setIsNoteViewerOpen(true);
            }}
            onEditNote={handleEditNote}
            onManageHolidays={() => setIsHolidayEditorOpen(true)}
          />
        );
      }
      case 'team': {
        const teamEmployees = employees.filter(emp => emp.role !== 'admin' && emp.group === currentUser.group);
        return <TeamView employees={teamEmployees} currentUser={currentUser} onEditMember={(emp) => handleEditMember(emp, 'manager')} />;
      }
      case 'onduty':
        return <OndutyView employees={employees} shifts={shifts} currentUser={currentUser} />;
       case 'org-chart':
        return <OrgChartView employees={employees} currentUser={currentUser} />;
      case 'celebrations':
        return <CelebrationsView employees={employees} />;
      case 'holidays':
        return <HolidaysView 
                  holidays={holidays} 
                  isManager={currentUser.role === 'manager' || currentUser.role === 'admin'}
                  onManageHolidays={() => setIsHolidayEditorOpen(true)}
                />;
      case 'allowance':
        return <AllowanceView 
                  employees={employees}
                  setEmployees={setEmployees}
                  allowances={allowances} 
                  setAllowances={setAllowances} 
                  currentUser={currentUser} 
               />;
      case 'my-schedule':
        return <MyScheduleView shifts={shiftsForView} employeeId={currentUser.id} employees={employees} />;
      case 'my-tasks':
        return <MyTasksView tasks={tasks} setTasks={setTasks} shifts={shifts} currentUser={currentUser} />;
      case 'task-manager':
        return <TaskManagerView tasks={tasks} setTasks={setTasks} currentUser={currentUser} employees={employees} />;
      case 'admin':
        return (
            <AdminPanel 
                users={employees} 
                setUsers={setEmployees}
                groups={groups}
                onAddMember={() => handleAddMember('admin')}
                onEditMember={(emp) => handleEditMember(emp, 'admin')}
                onDeleteMember={handleDeleteMember}
                onBatchDelete={handleBatchDeleteMembers}
                onImportMembers={() => setIsImporterOpen(true)}
                onManageGroups={() => setIsGroupEditorOpen(true)}
                onManageSmtp={() => setIsSmtpSettingsOpen(true)}
            />
        );
      default:
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to OnDuty</CardTitle>
                    <CardDescription>Select a view from the sidebar to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>You are currently logged in as {currentUser.firstName}.</p>
                </CardContent>
            </Card>
        );
    }
  }, [activeView, employees, shifts, leave, notes, holidays, tasks, allowances, currentUser, groups, shiftsForView, addNotification, router, toast]);

  if (!currentUser) {
      return null;
  }

  const userNotifications = notifications.filter(n => !n.employeeId || n.employeeId === currentUser.id);

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
          notifications={userNotifications}
          setNotifications={setNotifications}
          onNavigate={handleNavigate}
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
     <HolidayEditor
        isOpen={isHolidayEditorOpen}
        setIsOpen={setIsHolidayEditorOpen}
        holidays={holidays}
        setHolidays={setHolidays}
    />
    <SmtpSettingsDialog
        isOpen={isSmtpSettingsOpen}
        setIsOpen={setIsSmtpSettingsOpen}
        settings={smtpSettings}
        onSave={setSmtpSettings}
    />
    <NoteEditor
        isOpen={isNoteEditorOpen}
        setIsOpen={setIsNoteEditorOpen}
        note={editingNote}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
    />
    {viewingNote && (
        <NoteViewer
            isOpen={isNoteViewerOpen}
            setIsOpen={setIsNoteViewerOpen}
            note={viewingNote}
            isManager={currentUser.role === 'manager' || currentUser.role === 'admin'}
            onEdit={(note) => {
                if ('description' in note) {
                    setIsNoteViewerOpen(false);
                    handleEditNote(note);
                }
            }}
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
