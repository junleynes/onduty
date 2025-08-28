

'use client';

import React, { useState, useMemo } from 'react';
import { addDays, format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, getDay, addMonths, isToday, getISOWeek, eachWeekOfInterval, lastDayOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import type { Employee, Shift, Leave, Notification } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { PlusCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Copy, CircleSlash, UserX, Download, Upload, Settings, Save, Send, MoreVertical, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { ShiftEditor, type ShiftTemplate } from './shift-editor';
import { LeaveEditor } from './leave-editor';
import { Progress } from './ui/progress';
import { ShiftBlock } from './shift-block';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ScheduleImporter } from './schedule-importer';
import { TemplateImporter } from './template-importer';
import { LeaveTypeEditor, type LeaveTypeOption } from './leave-type-editor';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';


type ViewMode = 'day' | 'week' | 'month';

type ScheduleViewProps = {
  employees: Employee[];
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leave: Leave[];
  setLeave: React.Dispatch<React.SetStateAction<Leave[]>>;
  currentUser: Employee | null;
  onPublish: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
}

const initialShiftTemplates: ShiftTemplate[] = [
    { name: 'Morning Shift (06:00-14:00)', label: 'Morning Shift', startTime: '06:00', endTime: '14:00', color: 'hsl(var(--chart-2))' },
    { name: 'Late Morning Shift (07:00-15:00)', label: 'Late Morning Shift', startTime: '07:00', endTime: '15:00', color: 'hsl(var(--chart-2))' },
    { name: 'Afternoon Shift (14:00-22:00)', label: 'Afternoon Shift', startTime: '14:00', endTime: '22:00', color: '#3498db' },
    { name: 'Early-Afternoon Shift (12:00-20:00)', label: 'Early-Afternoon Shift', startTime: '12:00', endTime: '20:00', color: '#3498db' },
    { name: 'Night Shift (22:00-06:00)', label: 'Night Shift', startTime: '22:00', endTime: '06:00', color: '#e91e63' },
    { name: 'Early Mid Shift (08:00-16:00)', label: 'Early Mid Shift', startTime: '08:00', endTime: '16:00', color: '#ffffff' },
    { name: 'Mid Shift (10:00-18:00)', label: 'Mid Shift', startTime: '10:00', endTime: '18:00', color: '#ffffff' },
    { name: 'Manager Shift (10:00-19:00)', label: 'Manager Shift', startTime: '10:00', endTime: '19:00', color: 'hsl(var(--chart-4))' },
    { name: 'Manager Shift (11:00-20:00)', label: 'Manager Shift', startTime: '11:00', endTime: '20:00', color: 'hsl(var(--chart-4))' },
    { name: 'Manager Shift (12:00-21:00)', label: 'Manager Shift', startTime: '12:00', endTime: '21:00', color: 'hsl(var(--chart-4))' },
    { name: 'Probationary Shift (09:00-18:00)', label: 'Probationary Shift', startTime: '09:00', endTime: '18:00', color: 'hsl(var(--chart-1))' },
];

const initialLeaveTypes: LeaveTypeOption[] = [
    { type: 'VL', color: '#3b82f6' }, // blue
    { type: 'EL', color: '#ef4444' }, // red
    { type: 'OFFSET', color: '#6b7280' }, // gray
    { type: 'SL', color: '#f97316' }, // orange
    { type: 'BL', color: '#14b8a6' }, // teal
    { type: 'PL', color: '#8b5cf6' }, // purple
    { type: 'ML', color: '#ec4899' }, // pink
];

// New component for rendering shifts inside a month cell
const MonthShiftItem: React.FC<{item: Shift | Leave, employee?: Employee | null, onClick: () => void}> = ({ item, employee, onClick }) => {
  const employeeForBlock = 'employeeId' in item ? employee : undefined;

  return (
    <div onClick={onClick} className="flex items-center gap-1.5 p-1 rounded-md hover:bg-accent cursor-pointer group">
      {employee && (
        <Avatar className="h-5 w-5">
            <AvatarImage src={employee.avatar} data-ai-hint="profile avatar" />
            <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(employee)) }} className="text-xs">
                {getInitials(getFullName(employee))}
            </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 overflow-hidden">
         <ShiftBlock item={item} onClick={() => {}} context="month" interactive={false} employee={employeeForBlock} />
      </div>
    </div>
  )
}

export default function ScheduleView({ employees, shifts, setShifts, leave, setLeave, currentUser, onPublish, addNotification }: ScheduleViewProps) {
  const isReadOnly = currentUser?.role === 'member';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isShiftEditorOpen, setIsShiftEditorOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | Partial<Shift> | null>(null);

  const [isLeaveEditorOpen, setIsLeaveEditorOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Partial<Leave> | null>(null);
  
  const [isLeaveTypeEditorOpen, setIsLeaveTypeEditorOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>(initialLeaveTypes);

  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isTemplateImporterOpen, setIsTemplateImporterOpen] = useState(false);
  
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(initialShiftTemplates);
  const [weekTemplate, setWeekTemplate] = useState<Omit<Shift, 'id' | 'date'>[] | null>(null);
  const { toast } = useToast();

  const dateRange = useMemo(() => {
    switch (viewMode) {
        case 'day':
            return { from: currentDate, to: currentDate };
        case 'week':
            return { from: startOfWeek(currentDate, { weekStartsOn: 1 }), to: endOfWeek(currentDate, { weekStartsOn: 1 }) };
        case 'month':
            return { from: startOfMonth(currentDate), to: endOfMonth(currentDate) };
        default:
            return { from: startOfWeek(currentDate, { weekStartsOn: 1 }), to: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    }
  }, [currentDate, viewMode]);
  
  const displayedDays = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    }
    return [];
  }, [dateRange]);

  const handleAddShiftClick = () => {
    if (isReadOnly) return;
    setEditingShift({});
    setIsShiftEditorOpen(true);
  };
  
  const handleAddLeaveClick = () => {
    if (isReadOnly) return;
    setEditingLeave({ type: 'VL', isAllDay: true, date: new Date() });
    setIsLeaveEditorOpen(true);
  };

  const handleEmptyCellClick = (employeeId: string | null, date: Date) => {
    if (isReadOnly) return;
    setEditingShift({ employeeId, date, status: 'draft' });
    setIsShiftEditorOpen(true);
  };

  const handleEditItemClick = (item: Shift | Leave) => {
    if (isReadOnly) return;
    if ('label' in item) { // It's a shift
        setEditingShift(item);
        setIsShiftEditorOpen(true);
    } else { // It's leave
        setEditingLeave(item);
        setIsLeaveEditorOpen(true);
    }
  };

  const handleSaveShift = (savedShift: Shift | Partial<Shift>) => {
    if (isReadOnly) return;
    const employeeName = savedShift.employeeId ? getFullName(employees.find(e => e.id === savedShift.employeeId)!) : 'Unassigned';
    if ('id' in savedShift && savedShift.id) {
      // Update existing shift
      setShifts(shifts.map(s => s.id === savedShift.id ? { ...s, ...savedShift, status: 'draft' } as Shift : s));
      addNotification({ message: `Shift for ${employeeName} on ${format(savedShift.date!, 'MMM d')} was updated.` });
    } else {
      // Add new shift
      const newShiftWithId = { ...savedShift, id: `sh-${Date.now()}`, status: 'draft' };
      setShifts([...shifts, newShiftWithId as Shift]);
      addNotification({ message: `New shift created for ${employeeName} on ${format(savedShift.date!, 'MMM d')}.` });
    }
    setIsShiftEditorOpen(false);
    setEditingShift(null);
  };
  
  const handleDeleteShift = (shiftId: string) => {
    if (isReadOnly) return;
    const deletedShift = shifts.find(s => s.id === shiftId);
    if(deletedShift) {
      const employeeName = deletedShift.employeeId ? getFullName(employees.find(e => e.id === deletedShift.employeeId)!) : 'Unassigned';
      addNotification({ message: `Shift for ${employeeName} on ${format(deletedShift.date!, 'MMM d')} was deleted.` });
    }
    setShifts(shifts.filter(s => s.id !== shiftId));
    setIsShiftEditorOpen(false);
    setEditingShift(null);
    toast({ title: "Shift Deleted", variant: "destructive" });
  };


  const handleSaveLeave = (savedLeave: Leave | Partial<Leave>) => {
    if (isReadOnly) return;
    const employeeName = getFullName(employees.find(e => e.id === savedLeave.employeeId)!);
    if (savedLeave.id) {
        setLeave(leave.map(l => l.id === savedLeave.id ? savedLeave as Leave : l));
        addNotification({ message: `Time off for ${employeeName} on ${format(savedLeave.date!, 'MMM d')} was updated.` });
        toast({ title: "Leave Updated" });
    } else {
        const newLeaveWithId = { ...savedLeave, id: `leave-${Date.now()}` } as Leave;
        setLeave(prevLeave => [...prevLeave, newLeaveWithId]);
        addNotification({ message: `Time off for ${employeeName} on ${format(savedLeave.date!, 'MMM d')} was added.` });
        toast({ title: "Time Off Added" });
    }
    setIsLeaveEditorOpen(false);
    setEditingLeave(null);
  };
  
  const handleDeleteLeave = (leaveId: string) => {
    if (isReadOnly) return;
    const deletedLeave = leave.find(l => l.id === leaveId);
     if(deletedLeave) {
      const employeeName = getFullName(employees.find(e => e.id === deletedLeave.employeeId)!);
      addNotification({ message: `Time off for ${employeeName} on ${format(deletedLeave.date!, 'MMM d')} was deleted.` });
    }
    setLeave(leave.filter(l => l.id !== leaveId));
    setIsLeaveEditorOpen(false);
    setEditingLeave(null);
    toast({ title: "Leave Deleted", variant: "destructive" });
  };


  const navigateDate = (direction: 'prev' | 'next') => {
      let daysToAdd = 0;
      if (viewMode === 'week') daysToAdd = 7;
      if (viewMode === 'day') daysToAdd = 1;
      
      let newDate;
      if (viewMode === 'month') {
        newDate = addMonths(currentDate, direction === 'prev' ? -1 : 1);
      } else {
        newDate = addDays(currentDate, direction === 'prev' ? -daysToAdd : daysToAdd);
      }
      setCurrentDate(newDate);
  }
  
  // Action handlers
  const handleClearWeek = () => {
    if (isReadOnly) return;
    setShifts(currentShifts => currentShifts.filter(shift => !displayedDays.some(day => isSameDay(shift.date, day))));
    toast({ title: "Week Cleared", description: "All shifts for the current week have been removed." });
  };

  const handleClearMonth = () => {
    if (isReadOnly) return;
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    setShifts(currentShifts => currentShifts.filter(shift => shift.date < monthStart || shift.date > monthEnd));
    toast({ title: "Month Cleared", description: "All shifts for the current month have been removed." });
  };


  const handleUnassignWeek = () => {
    if (isReadOnly) return;
    setShifts(currentShifts => currentShifts.map(shift => 
      displayedDays.some(day => isSameDay(shift.date, day)) 
        ? { ...shift, employeeId: null } 
        : shift
    ));
    toast({ title: "Week Unassigned", description: "All shifts for the current week have been moved to unassigned." });
  };

  const handleUnassignMonth = () => {
    if (isReadOnly) return;
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    setShifts(currentShifts => currentShifts.map(shift => 
      shift.date >= monthStart && shift.date <= monthEnd
        ? { ...shift, employeeId: null } 
        : shift
    ));
    toast({ title: "Month Unassigned", description: "All shifts for the current month have been moved to unassigned." });
  };

  const handleCopyPreviousWeek = () => {
    if (isReadOnly) return;
    const prevWeekStart = subDays(dateRange.from, 7);
    const prevWeekEnd = subDays(dateRange.to, 7);
    const prevWeekShifts = shifts.filter(shift => shift.date >= prevWeekStart && shift.date <= prevWeekEnd);

    const newShifts = prevWeekShifts.map(shift => ({
      ...shift,
      id: `sh-${Date.now()}-${Math.random()}`,
      date: addDays(shift.date, 7),
      status: 'draft' as const,
    }));

    setShifts(currentShifts => [...currentShifts, ...newShifts]);
    toast({ title: "Previous Week Copied", description: "Shifts from the previous week have been copied over." });
  };

  const handleSaveTemplate = () => {
    if (isReadOnly) return;
    const shiftsInView = shifts.filter(shift => displayedDays.some(day => isSameDay(shift.date, day)));
    const template = shiftsInView.map(({ id, date, ...rest }) => ({
      ...rest,
      dayOfWeek: date.getDay(), // 0 for Sunday, 1 for Monday, etc.
    }));
    setWeekTemplate(template as any); // Type casting to avoid complex dayOfWeek type
    toast({ title: "Template Saved", description: "Current week's layout has been saved as a template." });
  };

  const handleLoadTemplate = () => {
    if (isReadOnly) return;
    if (!weekTemplate) {
      toast({ variant: 'destructive', title: "No Template Saved", description: "Save a week as a template first." });
      return;
    }
    
    // Clear current week before applying template
    const shiftsOutsideCurrentWeek = shifts.filter(shift => !displayedDays.some(day => isSameDay(shift.date, day)));
    
    const newShifts = weekTemplate.map((templateShift: any) => {
        const targetDay = displayedDays.find(d => d.getDay() === templateShift.dayOfWeek);
        if (!targetDay) return null;
        
        const { dayOfWeek, ...rest } = templateShift;
        return {
            ...rest,
            id: `sh-${Date.now()}-${Math.random()}`,
            date: targetDay,
            status: 'draft',
        };
    }).filter(Boolean);

    setShifts([...shiftsOutsideCurrentWeek, ...newShifts as Shift[]]);
    toast({ title: "Template Loaded", description: "The saved template has been applied to the current week." });
  };

  const handleImportedData = (importedShifts: Shift[], importedLeave: Leave[]) => {
      const shiftsWithStatus = importedShifts.map(s => ({ ...s, status: 'draft' as const }));
      setShifts(prev => [...prev, ...shiftsWithStatus]);
      setLeave(prev => [...prev, ...importedLeave]);
  };
  
  const handleImportTemplates = (importedTemplates: ShiftTemplate[]) => {
      setShiftTemplates(prev => [...prev, ...importedTemplates]);
  };

  const handleSaveDraft = () => {
    toast({ title: "Draft Saved", description: "Your schedule changes have been saved." });
    // Data is already saved to local storage via useEffect, so this is just for user feedback.
  };

  const allEmployeesForGrid = [{ id: 'unassigned', firstName: 'Unassigned Shifts', lastName: '', role: 'member', position: 'Special', avatar: '' }, ...employees];

  const calculateDailyHours = (day: Date) => {
    const dailyShifts = shifts.filter(s => isSameDay(s.date, day) && !s.isDayOff && !s.isHolidayOff);
    return dailyShifts.reduce((acc, shift) => {
        if (!shift.startTime || !shift.endTime) return acc;
        
        const start = new Date(`1970-01-01T${shift.startTime}`);
        const end = new Date(`1970-01-01T${shift.endTime}`);
        
        let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (diff < 0) { // Handles overnight shifts
            diff += 24;
        }
        return acc + diff;
    }, 0);
  }

  const dailyShiftCount = (day: Date) => {
    return shifts.filter(s => isSameDay(s.date, day) && !s.isDayOff && !s.isHolidayOff).length;
  }

  const dailyEmployeeCount = (day: Date) => {
    const assignedShifts = shifts.filter(s => isSameDay(s.date, day) && s.employeeId && !s.isDayOff && !s.isHolidayOff);
    const assignedLeave = leave.filter(l => isSameDay(l.date, day) && l.employeeId);
    return new Set([...assignedShifts.map(s => s.employeeId), ...assignedLeave.map(l => l.employeeId)]).size;
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: Shift | Leave) => {
    if (isReadOnly) return;
    e.dataTransfer.setData("itemId", item.id);
    const itemType = 'label' in item ? 'shift' : 'leave';
    e.dataTransfer.setData("itemType", itemType);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetEmployeeId: string | null, targetDate: Date) => {
    if (isReadOnly) return;
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");
    const itemType = e.dataTransfer.getData("itemType");
    
    if (itemType === 'shift') {
      setShifts(prevShifts => 
        prevShifts.map(shift =>
          shift.id === itemId
            ? { ...shift, employeeId: targetEmployeeId, date: targetDate, status: 'draft' }
            : shift
        )
      );
    } else if (itemType === 'leave') {
       setLeave(prevLeave => 
        prevLeave.map(l =>
          l.id === itemId
            ? { ...l, employeeId: targetEmployeeId!, date: targetDate }
            : l
        )
      );
    }
  };
  
  const formatRange = (start: Date, end: Date) => {
      if (viewMode === 'month') {
        return format(start, 'MMMM yyyy');
      }
      if (isSameDay(start, end)) {
          return format(start, 'MMM d, yyyy');
      }
      if (start.getFullYear() !== end.getFullYear()) {
          return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
      }
      if (start.getMonth() !== end.getMonth()) {
          return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  
  const renderHorizontalGrid = () => {
    const days = displayedDays;
    const gridTemplateColumns = `200px repeat(${days.length}, 1fr)`;

    return (
        <div className="grid" style={{ gridTemplateColumns }}>
            {/* Header Row */}
            <div className="sticky top-0 left-0 z-30 p-2 bg-card border-b border-r flex items-center justify-center">
            <span className="font-semibold text-sm">Employees</span>
            </div>
            {days.map((day) => (
            <div key={day.toISOString()} className="sticky top-0 z-10 col-start-auto p-2 text-center font-semibold bg-card border-b border-l">
                <div className="text-sm whitespace-nowrap">{format(day, 'E d')}</div>
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground mt-1 cursor-default">
                        {dailyShiftCount(day)} shifts, {dailyEmployeeCount(day)} users
                    </div>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Total shifts and unique employees scheduled for the day.</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <div>
                        <Progress value={(calculateDailyHours(day) / (8 * 5)) * 100} className="h-1 mt-1"/>
                        <div className="text-xs font-normal text-muted-foreground">{calculateDailyHours(day)} hrs</div>
                    </div>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Total scheduled work hours for the day.</p>
                    </TooltipContent>
                </Tooltip>
                </TooltipProvider>
            </div>
            ))}

            {/* Employee Rows */}
            {allEmployeesForGrid.map((employee) => (
            <React.Fragment key={employee.id}>
                {/* Employee Cell */}
                <div className="sticky left-0 z-20 py-1 px-2 border-b border-r flex items-center gap-3 min-h-[52px] bg-card">
                {employee.id !== 'unassigned' ? (
                <Avatar className="h-9 w-9">
                    <AvatarImage src={employee.avatar} data-ai-hint="profile avatar" />
                    <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(employee)) }}>
                    {getInitials(getFullName(employee))}
                    </AvatarFallback>
                </Avatar>
                ) : <div className="w-full flex items-center justify-center">
                        <p className="font-semibold text-sm text-center">{getFullName(employee)}</p>
                    </div>}
                {employee.id !== 'unassigned' && <div>
                    <p className="font-semibold text-sm">{getFullName(employee)}</p>
                </div>}
                </div>

                {/* Day Cells for Shifts */}
                {days.map((day) => {
                const itemsForDay = [
                    ...shifts.filter(
                        (s) => (s.employeeId === employee.id || (employee.id === 'unassigned' && s.employeeId === null)) && isSameDay(s.date, day)
                    ),
                    ...leave.filter(
                        (l) => l.employeeId === employee.id && isSameDay(l.date, day)
                    )
                ];
                return (
                    <div
                    key={`${employee.id}-${day.toISOString()}`}
                    className={cn("group/cell col-start-auto p-1 border-b border-l min-h-[52px] space-y-1 bg-background/30 relative")}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, employee.id === 'unassigned' ? null : employee.id, day)}
                    >
                    <div className={cn(viewMode === 'month' && 'mt-5')}>
                        {itemsForDay.map((item) => (
                        <div key={item.id} draggable={!isReadOnly} onDragStart={(e) => handleDragStart(e, item)}>
                            <ShiftBlock
                            item={item}
                            onClick={() => !isReadOnly && handleEditItemClick(item)}
                            context="week"
                            />
                        </div>
                        ))}
                    </div>
                    {itemsForDay.length === 0 && !isReadOnly && (
                        <Button variant="ghost" className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity" onClick={() => handleEmptyCellClick(employee.id === 'unassigned' ? null : employee.id, day)}>
                        <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    )}
                    </div>
                );
                })}
            </React.Fragment>
            ))}
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
       <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn('w-[260px] justify-start text-left font-normal text-sm')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  formatRange(dateRange.from, dateRange.to)
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-1 rounded-md border bg-card p-1">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          {!isReadOnly && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleAddShiftClick}>Add Shift</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddLeaveClick}>Add Time Off</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSaveDraft}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                </Button>
                <Button onClick={onPublish}>
                    <Send className="mr-2 h-4 w-4" />
                    Publish
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            Actions
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => setIsImporterOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Import Schedule</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsTemplateImporterOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Import Templates</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setIsLeaveTypeEditorOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Manage Leave Types</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem onClick={handleCopyPreviousWeek} disabled={viewMode !== 'week'}>
                                <Copy className="mr-2 h-4 w-4" />
                                <span>Copy Previous Week</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={handleSaveTemplate} disabled={viewMode !== 'week'}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Save as Template</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLoadTemplate} disabled={!weekTemplate || viewMode !== 'week'}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Load Template</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                         <DropdownMenuGroup>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={viewMode === 'month' ? handleClearMonth : handleClearWeek}>
                                <CircleSlash className="mr-2 h-4 w-4" />
                                <span>Clear {viewMode === 'month' ? 'Month' : 'Week'}</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={viewMode === 'month' ? handleUnassignMonth : handleUnassignWeek}>
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Unassign {viewMode === 'month' ? 'Month' : 'Week'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </>
          )}
        </div>
      </header>
    
      <div className="flex-1 overflow-auto">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            {renderHorizontalGrid()}
          </CardContent>
        </Card>
      </div>

      <ShiftEditor
        isOpen={isShiftEditorOpen}
        setIsOpen={setIsShiftEditorOpen}
        shift={editingShift}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        employees={employees}
        shiftTemplates={shiftTemplates}
        setShiftTemplates={setShiftTemplates}
      />
      <LeaveEditor
        isOpen={isLeaveEditorOpen}
        setIsOpen={setIsLeaveEditorOpen}
        leave={editingLeave}
        onSave={handleSaveLeave}
        onDelete={handleDeleteLeave}
        employees={employees}
        leaveTypes={leaveTypes}
      />
       <LeaveTypeEditor
        isOpen={isLeaveTypeEditorOpen}
        setIsOpen={setIsLeaveTypeEditorOpen}
        leaveTypes={leaveTypes}
        setLeaveTypes={setLeaveTypes}
      />
      <ScheduleImporter
        isOpen={isImporterOpen}
        setIsOpen={setIsImporterOpen}
        onImport={handleImportedData}
        employees={employees}
        shiftTemplates={shiftTemplates}
      />
       <TemplateImporter 
        isOpen={isTemplateImporterOpen}
        setIsOpen={setIsTemplateImporterOpen}
        onImport={handleImportTemplates}
      />
    </div>
  );
}
