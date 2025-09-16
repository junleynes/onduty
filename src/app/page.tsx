

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { UserRole, Employee, Shift, Leave, Notification, Note, Holiday, Task, CommunicationAllowance, SmtpSettings, TardyRecord, RolePermissions } from '@/types';
import type { ShiftTemplate, ShiftWithRepeat } from '@/components/shift-editor';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';
import { isSameDay, getMonth, getDate, getYear, format, differenceInYears, addDays, isBefore } from 'date-fns';
import { getData, saveAllData } from '@/lib/db-actions';
import { addEmployee, updateEmployee } from '@/app/employee-actions';
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
import type { LeaveTypeOption } from '@/components/leave-type-editor';
import type { NavItemKey } from '@/types';
import { PermissionsEditor } from '@/components/permissions-editor';
import DangerZoneView from '@/components/danger-zone-view';
import DashboardView from '@/components/dashboard-view';
import FaqView from '@/components/faq-view';
import NewsFeedsView from '@/components/news-feeds-view';
import ChatView from '@/components/chat-view';
import { AlafTemplateUploader } from '@/components/alaf-template-uploader';


export type NavItem = NavItemKey;


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
  const [tardyRecords, setTardyRecords] = useState<TardyRecord[]>([]);
  const [templates, setTemplates] = useState<Record<string, string | null>>({});
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [permissions, setPermissions] = useState<RolePermissions>({ admin: [], manager: [], member: []});
  const [monthlyEmployeeOrder, setMonthlyEmployeeOrder] = useState<Record<string, string[]>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<NavItem>('dashboard');
  
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
  const [isAlafUploaderOpen, setIsAlafUploaderOpen] = useState(false);


  const { notifications, setNotifications, addNotification, addNotificationForUser } = useNotifications();

  // Save all data to the database whenever there's a change
  useEffect(() => {
    if (!initialDataLoaded || isLoading) return;
    
    const dataToSave = {
        employees,
        shifts,
        leave,
        notes,
        holidays,
        tasks,
        allowances,
        groups,
        smtpSettings,
        tardyRecords,
        templates,
        shiftTemplates,
        leaveTypes,
        permissions,
        monthlyEmployeeOrder,
    };

    const saveData = async () => {
        setIsSaving(true);
        try {
            const result = await saveAllData(dataToSave);
            if (!result.success) {
                 toast({
                    variant: 'destructive',
                    title: 'Save Failed',
                    description: result.error || 'Could not save changes to the database.',
                });
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Save Error',
                description: (error as Error).message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const timeoutId = setTimeout(saveData, 1500); // Debounce saves
    return () => clearTimeout(timeoutId);

  }, [initialDataLoaded, isLoading, toast, employees, shifts, leave, notes, holidays, tasks, allowances, groups, smtpSettings, tardyRecords, templates, shiftTemplates, leaveTypes, permissions, monthlyEmployeeOrder]);

  // Load initial data from DB and check for user
  useEffect(() => {
    async function loadDataAndAuth() {
      setIsLoading(true);
      
      const storedUserJson = localStorage.getItem('currentUser');
      if (!storedUserJson) {
          router.push('/login');
          setIsLoading(false);
          return;
      }
      
      const storedUser: Employee = JSON.parse(storedUserJson);
      let userToSet: Employee | null = null;
      
      // Handle special admin user first to avoid unnecessary DB calls if it's them
      if (storedUser.email === 'admin@onduty.local' && storedUser.id === 'emp-admin-01') {
          userToSet = {
              id: "emp-admin-01",
              employeeNumber: "001",
              firstName: "Super",
              lastName: "Admin",
              email: "admin@onduty.local",
              password: "P@ssw0rd",
              phone: "123-456-7890",
              position: "System Administrator",
              role: "admin",
              group: "Administration"
          };
      }
      
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
        setTardyRecords(result.data.tardyRecords);
        setShiftTemplates(result.data.shiftTemplates);
        setLeaveTypes(result.data.leaveTypes);
        setTemplates(result.data.templates);
        setPermissions(result.data.permissions);
        setMonthlyEmployeeOrder(result.data.monthlyEmployeeOrder);
        
        // If it wasn't the special admin, find the user from the DB
        if (!userToSet) {
          const userFromDb = result.data.employees.find(emp => emp.id === storedUser.id);
          if (userFromDb) {
            userToSet = userFromDb;
          }
        }
        
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: result.error || 'Could not connect to the database.',
        });
        handleLogout();
        return; // Stop execution if data load fails
      }

      // Final check to set user or log out
      if (userToSet) {
        setCurrentUser(userToSet);
        if (userToSet.role === 'admin') {
            setActiveView('admin');
        } else {
            setActiveView('dashboard');
        }
      } else {
        handleLogout(); 
      }
      
      setIsLoading(false);
      setInitialDataLoaded(true); // Signal that initial load is complete
    }
    loadDataAndAuth();
  }, [router, toast]);


  // Effect for sending celebration notifications
    useEffect(() => {
        if (!employees.length || !currentUser) return;

        const today = new Date();
        const storageKey = `celebrations-notified-${format(today, 'yyyy-MM-dd')}`;
        
        const getNotifiedToday = () => {
             if (typeof window === 'undefined') return [];
             return JSON.parse(localStorage.getItem(storageKey) || '[]');
        }
        
        const notifiedToday: string[] = getNotifiedToday();

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
                const yearsOfService = differenceInYears(today, startDate);
        
                const isMilestone = yearsOfService >= 5 && yearsOfService % 5 === 0;

                if (isMilestone) {
                    if (getMonth(startDate) === getMonth(today) && getDate(startDate) === getDate(today)) {
                         if (!notifiedToday.includes(`${employee.id}-anniversary`)) {
                            celebrationsToNotify.push({
                                employee,
                                type: 'anniversary',
                            });
                        }
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

  const approvedLeave = useMemo(() => leave.filter(l => l.status === 'approved'), [leave]);

  const shiftsForView = useMemo(() => {
    if (currentUser?.role === 'member') {
      return shifts.filter(shift => shift.status === 'published');
    }
    return shifts;
  }, [shifts, currentUser]);
  
  const leaveForView = useMemo(() => {
    if (currentUser?.role === 'member') {
        // Members see all approved leave, same as shifts.
        return approvedLeave;
    }
    // Managers and admins see all leave.
    return leave;
  }, [leave, approvedLeave, currentUser]);


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

  const handleEditMember = (employee: Employee, isPasswordReset = false) => {
    setEditingEmployee(employee);
    setIsPasswordResetMode(isPasswordReset);
    setEditorContext(currentUser?.role === 'admin' ? 'admin' : 'manager');
    setIsEditorOpen(true);
  };

  const handleDeleteMember = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    // The database's ON DELETE CASCADE will handle associated records.
    // We just need to update the state for other related items if necessary.
    setLeave(prev => prev.filter(l => l.employeeId !== employeeId));
    setShifts(prev => prev.filter(s => s.employeeId !== employeeId));
    setTasks(prev => prev.filter(t => t.assigneeId !== employeeId && t.createdBy !== employeeId));
    setAllowances(prev => prev.filter(a => a.employeeId !== employeeId));

    toast({ title: 'User Removed', description: 'The user and all their associated data have been removed.', variant: 'destructive' });
  };
  
  const handleBatchDeleteMembers = (employeeIds: string[]) => {
    const idsToDelete = new Set(employeeIds);
    setEmployees(prev => prev.filter(emp => !idsToDelete.has(emp.id)));
    
    // Again, rely on CASCADE for DB, just clean up state
    setLeave(prev => prev.filter(l => l.employeeId && !idsToDelete.has(l.employeeId)));
    setShifts(prev => prev.filter(s => s.employeeId && !idsToDelete.has(s.employeeId)));
    setTasks(prev => prev.filter(t => 
        (t.assigneeId && !idsToDelete.has(t.assigneeId)) &&
        !idsToDelete.has(t.createdBy)
    ));
    setAllowances(prev => prev.filter(a => a.employeeId && !idsToDelete.has(a.employeeId)));

    toast({ title: `${employeeIds.length} Users Removed`, description: 'All associated data has been removed.', variant: 'destructive' });
  };


 const handleSaveMember = async (employeeData: Partial<Employee>) => {
    if (employeeData.id) {
      // Update existing employee
      const result = await updateEmployee(employeeData);
      if (result.success && result.employee) {
        setEmployees(prev => prev.map(emp => emp.id === result.employee!.id ? {...emp, ...result.employee} as Employee : emp));
        if (currentUser?.id === result.employee.id) {
          const updatedUser = { ...currentUser, ...result.employee };
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        toast({ title: 'Member Updated', description: 'The team member details have been saved.'});
      } else {
        toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
      }
    } else {
      // Add new employee
      const result = await addEmployee(employeeData);
      if (result.success && result.employee) {
        setEmployees(prev => [...prev, result.employee!]);
        toast({ title: 'Member Added', description: 'The new team member has been created.' });
      } else {
        toast({ variant: 'destructive', title: 'Creation Failed', description: result.error });
      }
    }
  };
  
  const handleImportMembers = async (newMembers: Partial<Employee>[]) => {
    let successCount = 0;
    let errorCount = 0;
    let updatedEmployees = [...employees];

    for (const member of newMembers) {
      if (!member.email) {
        console.warn('Skipping member with no email:', member);
        errorCount++;
        continue;
      }
      
      const existingEmployee = updatedEmployees.find(e => e.email.toLowerCase() === member.email!.toLowerCase());
      
      const memberWithId = {
          ...member,
          id: existingEmployee?.id || uuidv4(),
      };

      // Resolve reportsTo ID after all employees are potentially added
      if (typeof member.reportsTo === 'string' && member.reportsTo) {
          const manager = updatedEmployees.find(e => 
              (e.firstName + ' ' + e.lastName).toLowerCase() === member.reportsTo?.toLowerCase() ||
              (e.firstName + ' ' + e.middleInitial + ' ' + e.lastName).toLowerCase() === member.reportsTo?.toLowerCase()
          );
          if (manager) {
              memberWithId.reportsTo = manager.id;
          } else {
              console.warn(`Manager "${member.reportsTo}" not found for employee "${member.firstName} ${member.lastName}". Setting reportsTo to null.`);
              memberWithId.reportsTo = null;
          }
      }

      if (existingEmployee) {
        // Update existing employee
        const result = await updateEmployee({ ...existingEmployee, ...memberWithId });
        if (result.success && result.employee) {
            updatedEmployees = updatedEmployees.map(emp => emp.id === result.employee!.id ? {...emp, ...result.employee} as Employee : emp);
            successCount++;
        } else {
            console.error(`Failed to update imported member ${member.email}:`, result.error);
            errorCount++;
        }
      } else {
        // Add new employee
        const result = await addEmployee(memberWithId);
        if (result.success && result.employee) {
            updatedEmployees.push(result.employee);
            successCount++;
        } else {
             console.error(`Failed to add imported member ${member.email}:`, result.error);
            errorCount++;
        }
      }
    }
    
    setEmployees(updatedEmployees);

    toast({
      title: 'Import Complete',
      description: `${successCount} member(s) processed successfully. ${errorCount > 0 ? `${errorCount} failed.` : ''}`
    });
  };

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
  
  const handlePurgeData = (dataType: 'users' | 'shiftTemplates' | 'holidays' | 'reportTemplates' | 'tasks' | 'mobileLoad' | 'leaveTypes' | 'groups') => {
        switch (dataType) {
            case 'users':
                const adminUser = employees.find(e => e.id === 'emp-admin-01');
                setEmployees(adminUser ? [adminUser] : []);
                setShifts([]);
                setLeave([]);
                setTasks([]);
                setAllowances([]);
                setTardyRecords([]);
                break;
            case 'shiftTemplates':
                setShiftTemplates([]);
                break;
            case 'holidays':
                setHolidays([]);
                break;
            case 'reportTemplates':
                setTemplates({});
                break;
            case 'tasks':
                setTasks([]);
                break;
            case 'mobileLoad':
                setAllowances([]);
                setEmployees(prev => prev.map(e => ({ ...e, loadAllocation: 0 })));
                break;
            case 'leaveTypes':
                setLeaveTypes([]);
                break;
            case 'groups':
                setGroups([]);
                break;
        }
    };



  const currentView = useMemo(() => {
    if (!initialDataLoaded || !currentUser) {
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

    const membersOfMyGroup = employees.filter(e => e.group === currentUser.group);
    
    const userPermissions = permissions[currentUser.role] || [];
    // Admins have all permissions, non-admins must have the view explicitly granted
    const hasPermission = currentUser.role === 'admin' || userPermissions.includes(activeView)

    if (!hasPermission) {
         return (
             <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You do not have permission to view this page. Please contact an administrator.</p>
                </CardContent>
            </Card>
        )
    }


    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} permissions={permissions} role={currentUser.role} currentUser={currentUser} />;
      case 'schedule': {
        const scheduleEmployees = (currentUser.role === 'admin' ? employees : membersOfMyGroup).filter(e => e.role !== 'admin');
        
        return (
          <ScheduleView 
            employees={scheduleEmployees}
            setEmployees={setEmployees}
            shifts={shiftsForView}
            setShifts={setShifts}
            leave={leaveForView}
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
            shiftTemplates={shiftTemplates}
            setShiftTemplates={setShiftTemplates}
            leaveTypes={leaveTypes}
            setLeaveTypes={setLeaveTypes}
            monthlyEmployeeOrder={monthlyEmployeeOrder}
            setMonthlyEmployeeOrder={setMonthlyEmployeeOrder}
          />
        );
      }
      case 'team': {
        const teamEmployees = employees.filter(emp => emp.role !== 'admin' && emp.group === currentUser.group);
        return <TeamView employees={teamEmployees} currentUser={currentUser} onEditMember={handleEditMember} />;
      }
      case 'onduty':
        return <OndutyView employees={membersOfMyGroup} shifts={shifts} currentUser={currentUser} />;
       case 'org-chart':
        return <OrgChartView employees={membersOfMyGroup} currentUser={currentUser} />;
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
                  leaveTypes={leaveTypes}
                  smtpSettings={smtpSettings}
                  onUploadAlaf={() => setIsAlafUploaderOpen(true)}
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
      case 'faq':
        return <FaqView />;
      case 'reports':
          return <ReportsView 
                    employees={employees} 
                    shifts={shifts} 
                    leave={leave} 
                    holidays={holidays} 
                    currentUser={currentUser} 
                    tardyRecords={tardyRecords}
                    setTardyRecords={setTardyRecords}
                    templates={templates}
                    setTemplates={setTemplates}
                    shiftTemplates={shiftTemplates}
                    leaveTypes={leaveTypes}
                    permissions={permissions}
                    smtpSettings={smtpSettings}
                  />;
      case 'admin':
        return (
            <AdminPanel 
                users={employees} 
                setUsers={setEmployees}
                groups={groups}
                onAddMember={() => handleAddMember('admin')}
                onEditMember={handleEditMember}
                onDeleteMember={handleDeleteMember}
                onBatchDelete={handleBatchDeleteMembers}
                onImportMembers={() => setIsImporterOpen(true)}
                onManageGroups={() => setIsGroupEditorOpen(true)}
                smtpSettings={smtpSettings}
            />
        );
       case 'permissions':
        return <PermissionsEditor permissions={permissions} setPermissions={setPermissions} />;
      case 'smtp-settings':
        return <SmtpSettingsView settings={smtpSettings} onSave={setSmtpSettings} />;
      case 'danger-zone':
        return <DangerZoneView onPurgeData={handlePurgeData} />;
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
  }, [activeView, employees, shifts, leave, notes, holidays, tasks, allowances, smtpSettings, tardyRecords, templates, shiftTemplates, leaveForView, currentUser, groups, shiftsForView, addNotification, router, toast, initialDataLoaded, leaveTypes, permissions, monthlyEmployeeOrder]);

  if (!initialDataLoaded || !currentUser) {
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
      <Sidebar>
        <SidebarNav role={role} permissions={permissions} activeView={activeView} onNavigate={handleNavigate} />
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
        employees={employees}
    />
    <MemberImporter
        isOpen={isImporterOpen}
        setIsOpen={setIsImporterOpen}
        onImport={handleImportMembers}
        employees={employees}
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
     <AlafTemplateUploader 
        isOpen={isAlafUploaderOpen}
        setIsOpen={setIsAlafUploaderOpen}
        onTemplateUpload={(data) => setTemplates(prev => ({...prev, alafTemplate: data}))}
    />
    </>
  );
}

export default function Home() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppContent />
    </SidebarProvider>
  );
}
