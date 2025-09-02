

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { UserRole, Employee, Shift, Leave, Notification, Note, Holiday, Task, CommunicationAllowance, SmtpSettings } from '@/types';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';
import { getInitialState } from '@/lib/utils';
import { isSameDay, getMonth, getDate, getYear, format } from 'date-fns';
import { getData, saveAllData } from '@/lib/db-actions';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';


// Views
import ScheduleView from '@/components/schedule-view';
import MyScheduleView from '@/components/my-schedule-view';
import TeamView from '@/components/team-view';
import AdminPanel from '@/components/admin-panel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TeamEditor } from '@/components/team-editor';
import { MemberImporter } from '@/components/member-importer';
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
import SmtpSettingsView from '@/components/smtp-settings-view';
import { HolidayImporter } from '@/components/holiday-importer';
import ReportsView from '@/components/reports-view';
import TimeOffView from '@/components/time-off-view';


export type NavItem = 'schedule' | 'team' | 'my-schedule' | 'admin' | 'org-chart' | 'celebrations' | 'holidays' | 'onduty' | 'my-tasks' | 'allowance' | 'task-manager' | 'smtp-settings' | 'reports' | 'time-off';


function AppContent() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leave, setLeave] = useState<Leave[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allowances, setAllowances] = useState<CommunicationAllowance[]>([]);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<NavItem>('schedule');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false);
  const [isHolidayEditorOpen, setIsHolidayEditorOpen] = useState(false);
  const [isHolidayImporterOpen, setIsHolidayImporterOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [editorContext, setEditorContext] = useState<'admin' | 'manager'>('manager');

  const [isNoteViewerOpen, setIsNoteViewerOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | Holiday | null>(null);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);


  const { notifications, setNotifications, addNotification, addNotificationForUser } = useNotifications();

  // Save all data to the database whenever there's a change
  useEffect(() => {
    if (!initialDataLoaded) return;
    
    const saveData = async () => {
        setIsSaving(true);
        await saveAllData({
            employees,
            shifts,
            leave,
            notes,
            holidays,
            tasks,
            allowances,
            groups,
            smtpSettings,
        });
        setIsSaving(false);
    };

    const timeoutId = setTimeout(saveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);

  }, [employees, shifts, leave, notes, holidays, tasks, allowances, groups, smtpSettings, initialDataLoaded]);

  // Load initial data from DB and check for user
  useEffect(() => {
    async function loadDataAndAuth() {
      setIsLoading(true);
      const result = await getData();

      if (result.success && result.data) {
        setEmployees(result.data.employees);
        setShifts(result.data.shifts);
        setLeave(result.data.leave);
        setNotes(result.data.notes);
        setHolidays(result.data.holidays);
        setTasks(result.data.tasks);
        setAllowances(result.data.allowances);
        setGroups(result.data.groups);
        setSmtpSettings(result.data.smtpSettings);
        setInitialDataLoaded(true);

        const storedUserJson = localStorage.getItem('currentUser');
        if (storedUserJson) {
          const storedUser: Employee = JSON.parse(storedUserJson);
          const userFromDb = result.data.employees.find(emp => emp.id === storedUser.id);
          
          let userToSet: Employee | null = null;
          
          if (userFromDb) {
            userToSet = userFromDb;
          } else if (storedUser.email === 'admin@onduty.local') {
            userToSet = storedUser;
          }

          if (userToSet) {
            setCurrentUser(userToSet);
            if (userToSet.role === 'admin') {
              setActiveView('admin');
            } else if (userToSet.role === 'manager') {
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
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: result.error || 'Could not connect to the database.',
        });
        handleLogout();
      }
      setIsLoading(false);
    }
    loadDataAndAuth();
  }, [router, toast]);


  // Effect for sending celebration notifications
    useEffect(() => {
        if (!employees.length || !currentUser) return;

        const today = new Date();
        const storageKey = `celebrations-notified-${format(today, 'yyyy-MM-dd')}`;
        const notifiedToday: string[] = getInitialState(storageKey, []);

        const celebrationsToNotify: { employee: Employee; type: 'birthday' | 'anniversary' }[] = [];

        employees.forEach(employee => {
            if (employee.birthDate) {
                const birthDate = new Date(employee.birthDate);
                if (getMonth(birthDate) === getMonth(today) && getDate(birthDate) === getDate(today)) {
                    if (!notifiedToday.includes(`${employee.id}-birthday`)) {
                        celebrationsToNotify.push({ employee, type: 'birthday' });
                    }
                }
            }
            if (employee.startDate) {
                const startDate = new Date(employee.startDate);
                if (getYear(startDate) !== getYear(today) && getMonth(startDate) === getMonth(today) && getDate(startDate) === getDate(today)) {
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
    if (employeeData.id) {
        setEmployees(employees.map(emp => (emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp)));
        toast({ title: isPasswordResetMode ? 'Password Reset Successfully' : 'User Updated' });
    } else {
        const existingEmployeeByEmail = employees.find(emp => emp.email.toLowerCase() === employeeData.email?.toLowerCase());

        if (existingEmployeeByEmail) {
            toast({ title: 'Email Exists', description: 'An employee with this email already exists.', variant: 'destructive' });
            return;
        }
        
        const newEmployee: Employee = {
            ...employeeData,
            id: uuidv4(),
            avatar: employeeData.avatar || '',
            position: employeeData.position || '',
            role: employeeData.role || 'member',
            phone: employeeData.phone || '',
        } as Employee;
        setEmployees([...employees, newEmployee]);
        toast({ title: 'User Added' });
    }

    if (currentUser?.id === employeeData.id) {
        const updatedUser = { ...currentUser, ...employeeData };
        setCurrentUser(updatedUser as Employee);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };
  
  const handleImportMembers = (newMembers: Partial<Employee>[]) => {
      const newEmployees: Employee[] = newMembers.map((member) => ({
        ...member,
        id: uuidv4(),
        avatar: member.avatar || '',
        position: member.position || '',
        role: member.role || 'member',
        phone: member.phone || '',
      } as Employee));

      setEmployees(prev => [...prev, ...newEmployees]);
      toast({ title: 'Import Successful', description: `${newEmployees.length} new members added.`})
  }

  const handleImportHolidays = (newHolidays: Partial<Holiday>[]) => {
      const holidaysWithIds: Holiday[] = newHolidays.map((holiday) => ({
        ...holiday,
        id: uuidv4(),
      } as Holiday));

      setHolidays(prev => [...prev, ...holidaysWithIds]);
      toast({ title: 'Import Successful', description: `${holidaysWithIds.length} new holidays added.`})
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
        const newNoteWithId = { ...savedNote, id: uuidv4() } as Note;
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
    if (isLoading || !currentUser) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Loading application data. Please wait...</p>
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
            smtpSettings={smtpSettings}
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
       case 'time-off':
        return <TimeOffView
                  leaveRequests={leave}
                  setLeaveRequests={setLeave}
                  currentUser={currentUser}
                  employees={employees}
               />;
      case 'allowance':
        return <AllowanceView 
                  employees={employees}
                  setEmployees={setEmployees}
                  allowances={allowances} 
                  setAllowances={setAllowances} 
                  currentUser={currentUser} 
                  smtpSettings={smtpSettings}
               />;
      case 'my-schedule':
        return <MyScheduleView shifts={shiftsForView} employeeId={currentUser.id} employees={employees} />;
      case 'my-tasks':
        return <MyTasksView tasks={tasks} setTasks={setTasks} shifts={shifts} currentUser={currentUser} />;
      case 'task-manager':
        return <TaskManagerView tasks={tasks} setTasks={setTasks} currentUser={currentUser} employees={employees} />;
      case 'reports':
          return <ReportsView employees={employees} shifts={shifts} leave={leave} holidays={holidays} currentUser={currentUser} />;
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
            />
        );
      case 'smtp-settings':
        return <SmtpSettingsView settings={smtpSettings} onSave={setSmtpSettings} />
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
  }, [activeView, employees, shifts, leave, notes, holidays, tasks, allowances, smtpSettings, currentUser, groups, shiftsForView, addNotification, router, toast, isLoading]);

  if (isLoading || !currentUser) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
      );
  }

  const userNotifications = notifications.filter(n => !n.employeeId || n.employeeId === currentUser.id);
  const role = currentUser.role || 'member';

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
        onImport={() => setIsHolidayImporterOpen(true)}
    />
    <HolidayImporter
        isOpen={isHolidayImporterOpen}
        setIsOpen={setIsHolidayImporterOpen}
        onImport={handleImportHolidays}
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
