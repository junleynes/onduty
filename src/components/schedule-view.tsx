

'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { addDays, format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, getDay, addMonths, isToday, getISOWeek, eachWeekOfInterval, lastDayOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee, Shift, Leave, Notification, Note, Holiday, Task, SmtpSettings } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { PlusCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Copy, CircleSlash, UserX, Download, Upload, Settings, Save, Send, MoreVertical, ChevronsUpDown, Users, Clock, Briefcase, GripVertical, StickyNote, PartyPopper, Mail, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, getInitials, getBackgroundColor, getFullName, getInitialState } from '@/lib/utils';
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
import { initialShiftTemplates, initialLeaveTypes } from '@/lib/data';
import * as XLSX from 'xlsx-js-style';
import { sendEmail } from '@/app/actions';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { AttendanceTemplateUploader } from './attendance-template-uploader';

type ViewMode = 'day' | 'week' | 'month';

type ScheduleViewProps = {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leave: Leave[];
  setLeave: React.Dispatch<React.SetStateAction<Leave[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentUser: Employee;
  onPublish: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  onViewNote: (note: Note | Holiday | Partial<Note>) => void;
  onEditNote: (note: Partial<Note>) => void;
  onManageHolidays: () => void;
  smtpSettings: SmtpSettings;
}

export default function ScheduleView({ employees, setEmployees, shifts, setShifts, leave, setLeave, notes, setNotes, holidays, setTasks, tasks, setHolidays, currentUser, onPublish, addNotification, onViewNote, onEditNote, onManageHolidays, smtpSettings }: ScheduleViewProps) {
  const isReadOnly = currentUser?.role === 'member';
  
  const visibleEmployees = useMemo(() => employees.filter(e => e.visibility?.schedule !== false), [employees]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isShiftEditorOpen, setIsShiftEditorOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | Partial<Shift> | null>(null);
  
  const [viewEmployeeOrder, setViewEmployeeOrder] = useState<string[] | null>(null);

  const [attendanceTemplate, setAttendanceTemplate] = useState<any>(null);
  const [isTemplateUploaderOpen, setIsTemplateUploaderOpen] = useState(false);


  useEffect(() => {
    // Reset the custom order when the view or date range changes significantly
    setViewEmployeeOrder(null);
  }, [viewMode, currentDate.getMonth()]);

  useEffect(() => {
    // Load template from local storage on mount
    if (typeof window !== 'undefined') {
        const savedTemplate = localStorage.getItem('attendanceSheetTemplate');
        if (savedTemplate) {
            setAttendanceTemplate(JSON.parse(savedTemplate));
        }
    }
  }, []);
  

  const [isLeaveEditorOpen, setIsLeaveEditorOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Partial<Leave> | null>(null);
  
  const [isLeaveTypeEditorOpen, setIsLeaveTypeEditorOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>(() => getInitialState('leaveTypes', initialLeaveTypes));

  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isTemplateImporterOpen, setIsTemplateImporterOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(() => getInitialState('shiftTemplates', initialShiftTemplates));
  const [weekTemplate, setWeekTemplate] = useState<Omit<Shift, 'id' | 'date'>[] | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const weeksOfMonth = useMemo(() => {
    if (viewMode !== 'month') return [];
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const firstDay = startOfWeek(monthStart, { weekStartsOn: 1 });
    const lastDay = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachWeekOfInterval(
      { start: firstDay, end: lastDay },
      { weekStartsOn: 1 }
    ).map(weekStart =>
      eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) })
    );
  }, [currentDate, viewMode]);
  
  const orderedEmployees = useMemo(() => {
    const employeeMap = new Map(visibleEmployees.map(e => [e.id, e]));
    let baseEmployees = visibleEmployees;

    if (viewEmployeeOrder) {
      const orderedSet = new Set(viewEmployeeOrder);
      const ordered = viewEmployeeOrder.map(id => employeeMap.get(id)).filter((e): e is Employee => !!e);
      const unordered = visibleEmployees.filter(e => !orderedSet.has(e.id));
      baseEmployees = [...ordered, ...unordered];
    }
      
    return [
      { id: 'unassigned', firstName: 'Unassigned Shifts', lastName: '', role: 'member', position: 'Special', avatar: '' } as Employee,
      ...baseEmployees
    ];
  }, [visibleEmployees, viewEmployeeOrder]);
  

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
  
  const handleNoteCellClick = (date: Date) => {
    const existingNote = notes.find(n => isSameDay(new Date(n.date), date));
    const holiday = holidays.find(h => isSameDay(new Date(h.date), date));

    if (existingNote) {
        onViewNote(existingNote);
    } else if (holiday) {
        onViewNote(holiday);
    } else if (!isReadOnly) {
        onEditNote({ date });
    }
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
        addNotification({ message: `Time off for ${employeeName} on ${format(savedLeave.date!, 'MMM d')}.` });
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
    const itemsToClear = [...shifts, ...leave];
    const remainingItems = itemsToClear.filter(item => !displayedDays.some(day => isSameDay(item.date, day)));
    setShifts(remainingItems.filter(item => 'label' in item) as Shift[]);
    setLeave(remainingItems.filter(item => !('label' in item)) as Leave[]);
    toast({ title: "Week Cleared", description: "All shifts and time off for the current week have been removed." });
  };

  const handleClearMonth = () => {
    if (isReadOnly) return;
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const itemsToClear = [...shifts, ...leave];
    const remainingItems = itemsToClear.filter(item => new Date(item.date) < monthStart || new Date(item.date) > monthEnd);
    setShifts(remainingItems.filter(item => 'label' in item) as Shift[]);
    setLeave(remainingItems.filter(item => !('label' in item)) as Leave[]);
    toast({ title: "Month Cleared", description: "All shifts and time off for the current month have been removed." });
  };


  const handleUnassignWeek = () => {
    if (isReadOnly) return;
    setShifts(currentShifts => currentShifts.map(shift => 
      displayedDays.some(day => isSameDay(new Date(shift.date), day)) 
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
      new Date(shift.date) >= monthStart && new Date(shift.date) <= monthEnd
        ? { ...shift, employeeId: null } 
        : shift
    ));
    toast({ title: "Month Unassigned", description: "All shifts for the current month have been moved to unassigned." });
  };

  const handleCopyPreviousWeek = () => {
    if (isReadOnly) return;
    const prevWeekStart = subDays(dateRange.from, 7);
    const prevWeekEnd = subDays(dateRange.to, 7);
    const prevWeekShifts = shifts.filter(shift => new Date(shift.date) >= prevWeekStart && new Date(shift.date) <= prevWeekEnd);

    const newShifts = prevWeekShifts.map(shift => ({
      ...shift,
      id: `sh-${Date.now()}-${Math.random()}`,
      date: addDays(new Date(shift.date), 7),
      status: 'draft' as const,
    }));

    setShifts(currentShifts => [...currentShifts, ...newShifts]);
    toast({ title: "Previous Week Copied", description: "Shifts from the previous week have been copied over." });
  };

  const handleSaveTemplate = () => {
    if (isReadOnly) return;
    const shiftsInView = shifts.filter(shift => displayedDays.some(day => isSameDay(new Date(shift.date), day)));
    const template = shiftsInView.map(({ id, date, ...rest }) => ({
      ...rest,
      dayOfWeek: new Date(date).getDay(), // 0 for Sunday, 1 for Monday, etc.
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
    const shiftsOutsideCurrentWeek = shifts.filter(shift => !displayedDays.some(day => isSameDay(new Date(shift.date), day)));
    
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

  const handleImportedData = (importedData: {
    shifts: Shift[],
    leave: Leave[],
    employeeOrder: string[],
    overwrittenCells: { employeeId: string, date: Date }[]
  }) => {
    const { shifts: importedShifts, leave: importedLeave, employeeOrder, overwrittenCells } = importedData;

    // Create a set of cells to overwrite for efficient lookup
    const cellsToOverwrite = new Set(
      overwrittenCells.map(cell => `${cell.employeeId}-${format(cell.date, 'yyyy-MM-dd')}`)
    );
  
    // Filter out existing shifts and leave that are in the overwritten cells
    const remainingShifts = shifts.filter(s => 
        !cellsToOverwrite.has(`${s.employeeId}-${format(new Date(s.date), 'yyyy-MM-dd')}`)
    );
    const remainingLeave = leave.filter(l => 
        !cellsToOverwrite.has(`${l.employeeId}-${format(new Date(l.date), 'yyyy-MM-dd')}`)
    );
    
    const shiftsWithStatus = importedShifts.map(s => ({ ...s, status: 'draft' as const }));

    setShifts([...remainingShifts, ...shiftsWithStatus]);
    setLeave([...remainingLeave, ...importedLeave]);
    
    const currentEmployeeIds = employees.map(e => e.id);
    const validOrder = employeeOrder.filter(id => currentEmployeeIds.includes(id));
    setViewEmployeeOrder(validOrder);
  };
  
  const handleImportTemplates = (importedTemplates: ShiftTemplate[]) => {
      setShiftTemplates(prev => [...prev, ...importedTemplates]);
  };

  const handleSaveDraft = () => {
    toast({ title: "Draft Saved", description: "Your schedule changes have been saved." });
    // Data is already saved to local storage via useEffect, so this is just for user feedback.
  };

  const generateAttendanceSheetExcel = async (): Promise<string> => {
    if (viewMode !== 'week') {
      toast({ variant: 'destructive', title: 'Invalid View', description: 'Attendance Sheet can only be generated from the week view.' });
      return '';
    }
    if (!currentUser?.group) {
        toast({ variant: 'destructive', title: 'Missing User Info', description: 'Your profile must have a Group assigned to generate reports.' });
        return '';
    }

    if (!attendanceTemplate) {
        toast({ variant: 'destructive', title: 'No Template', description: 'Please upload an attendance sheet template first.' });
        return '';
    }

    // Create a copy of the workbook to avoid modifying the original template object
    const wb = XLSX.read(attendanceTemplate, { type: 'binary', cellStyles: true });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];

    // Simple placeholders
    const simplePlaceholders: { [key: string]: string } = {
        '{{group}}': currentUser.group || '',
        '{{week_of}}': `For the week of ${format(dateRange.from, 'MMMM d, yyyy')}`,
        '{{month}}': format(currentDate, 'MMMM').toUpperCase(),
    };
    
    displayedDays.forEach((day, index) => {
        simplePlaceholders[`{{day_${index + 1}}}`] = format(day, 'd');
    });

    let dataStartCellRef: string | null = null;
    let dataStartCoords = { r: -1, c: -1 };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            const cell = ws[cell_ref];

            if (cell && typeof cell.v === 'string') {
                const trimmedValue = cell.v.trim();
                if (simplePlaceholders[trimmedValue]) {
                    cell.v = simplePlaceholders[trimmedValue];
                } else if (trimmedValue === '{{data_start}}') {
                    dataStartCellRef = cell_ref;
                    dataStartCoords = { r: R, c: C };
                }
            }
        }
    }

    if (!dataStartCellRef) {
        toast({ variant: 'destructive', title: 'Template Error', description: 'The template must contain the {{data_start}} placeholder.' });
        return '';
    }

    const groupEmployees = employees.filter(e => e.group === currentUser.group);
    const dataToInsert = groupEmployees.map(emp => {
        const row = [
            `${emp.lastName}, ${emp.firstName} ${emp.middleInitial || ''}`.toUpperCase(),
            emp.group,
            emp.position
        ];
        
        displayedDays.forEach(day => {
            const shift = shifts.find(s => s.employeeId === emp.id && isSameDay(new Date(s.date), day));
            const leaveEntry = leave.find(l => l.employeeId === emp.id && isSameDay(new Date(l.date), day));
            const holiday = holidays.find(h => isSameDay(new Date(h.date), day));
            
            let cellValue = '';
            if (shift?.isHolidayOff || (holiday && (!shift || shift.isDayOff))) {
                cellValue = 'HOL OFF';
            } else if (leaveEntry) {
                cellValue = leaveEntry.type.toUpperCase();
            } else if (shift) {
                if (shift.isDayOff) cellValue = 'OFF';
                else {
                    const shiftLabel = shift.label?.trim().toUpperCase();
                    cellValue = (shiftLabel === 'WORK FROM HOME' || shiftLabel === 'WFH') ? 'WFH' : 'SKE';
                }
            }
            row.push(cellValue);
        });
        return row;
    });

    // Clear the placeholder itself
    ws[dataStartCellRef].v = '';

    XLSX.utils.sheet_add_aoa(ws, dataToInsert, { origin: dataStartCoords });

    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, ws, wsName);
    const excelBase64 = XLSX.write(newWb, { bookType: 'xlsx', type: 'base64' });
    return excelBase64;
}



  // Shift/Item Drag and Drop Handlers
  const handleShiftDragStart = (e: React.DragEvent<HTMLDivElement>, item: Shift | Leave) => {
    if (isReadOnly) return;
    e.dataTransfer.setData("itemId", item.id);
    const itemType = 'label' in item ? 'shift' : 'leave';
    e.dataTransfer.setData("itemType", itemType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleShiftDrop = (e: React.DragEvent<HTMLDivElement>, targetEmployeeId: string | null, targetDate: Date) => {
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
  
  // Employee Row Drag and Drop Handlers
  const handleEmployeeDragStart = (e: React.DragEvent<HTMLDivElement>, employeeId: string) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('draggedEmployeeId', employeeId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleEmployeeDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleEmployeeDrop = (e: React.DragEvent<HTMLDivElement>, targetEmployeeId: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    const draggedEmployeeId = e.dataTransfer.getData('draggedEmployeeId');
    if (!draggedEmployeeId || draggedEmployeeId === targetEmployeeId) return;

    const currentOrder = viewEmployeeOrder || visibleEmployees.map(e => e.id);
    const draggedIndex = currentOrder.indexOf(draggedEmployeeId);
    const targetIndex = currentOrder.indexOf(targetEmployeeId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    setViewEmployeeOrder(newOrder);
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

  const renderGridHeader = (days: Date[]) => (
     <div className="contents">
         {/* Header Row */}
        <div className={cn("sticky top-0 left-0 z-30 p-2 bg-card border-b border-r flex items-center justify-center")}>
            <p className="font-semibold text-sm">Employees</p>
        </div>
        {days.map((day) => {
            const shiftsForDay = shifts.filter(shift => isSameDay(new Date(shift.date), day) && !shift.isDayOff && !shift.isHolidayOff);
            const totalShifts = shiftsForDay.length;
            const onDutyEmployees = new Set(shiftsForDay.map(shift => shift.employeeId)).size;
            const totalHours = shiftsForDay.reduce((acc, shift) => {
                if (shift.startTime && shift.endTime) {
                    const start = new Date(`1970-01-01T${shift.startTime}`);
                    const end = new Date(`1970-01-01T${shift.endTime}`);
                    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (diff < 0) diff += 24; // Account for overnight shifts
                    return acc + diff;
                }
                return acc;
            }, 0);
            
            const isMonthAndOutside = viewMode === 'month' && day.getMonth() !== currentDate.getMonth();

            return (
                <div key={day.toISOString()} className={cn("sticky top-0 z-10 col-start-auto p-2 text-center font-semibold bg-card border-b border-l",
                    isMonthAndOutside && 'bg-muted/50'
                )}>
                    <div className="text-lg whitespace-nowrap">{format(day, 'E M/d')}</div>
                    <div className="text-xs text-muted-foreground font-normal flex justify-center gap-3 mt-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        <span>{totalShifts}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{totalShifts} shifts</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span>{onDutyEmployees}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{onDutyEmployees} employees on duty</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{totalHours.toFixed(1)}h</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{totalHours.toFixed(1)} scheduled hours</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            );
        })}
     </div>
  );
  
  const renderNotesRow = (days: Date[]) => (
    <div className="contents">
        <div className="sticky left-0 z-20 p-2 bg-card border-b border-r flex items-center justify-center">
            <p className="font-semibold text-sm">Notes</p>
        </div>
        {days.map(day => {
            const note = notes.find(n => isSameDay(new Date(n.date), day));
            const holiday = holidays.find(h => isSameDay(new Date(h.date), day));

            return (
                <div 
                    key={`note-${day.toISOString()}`}
                    className={cn("group/cell col-start-auto p-1 border-b border-l min-h-[40px] bg-background/30 relative text-xs flex flex-col items-center justify-center cursor-pointer hover:bg-accent",
                      viewMode === 'month' && day.getMonth() !== currentDate.getMonth() && 'bg-muted/50'
                    )}
                    onClick={() => handleNoteCellClick(day)}
                >
                    {holiday && (
                        <div className="w-full text-center p-1 rounded-sm bg-red-500 text-white">
                            <p className="font-bold truncate">{holiday.title}</p>
                        </div>
                    )}
                    {note && (
                        <div className="cursor-pointer text-center mt-1">
                            <p className="font-bold truncate">{note.title}</p>
                        </div>
                    )}
                    {!note && !holiday && !isReadOnly && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                            <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                </div>
            )
        })}
    </div>
  )

  const renderEmployeeRow = (employee: Employee, days: Date[]) => (
    <div 
        className="contents" 
        key={employee.id} 
        draggable={!isReadOnly && employee.id !== 'unassigned'}
        onDragStart={(e) => handleEmployeeDragStart(e, employee.id)}
        onDragOver={handleEmployeeDragOver}
        onDrop={(e) => handleEmployeeDrop(e, employee.id)}
        >
        {/* Employee Cell */}
        <div className={cn("sticky left-0 z-20 py-1 px-2 border-b border-r flex items-center gap-3 min-h-[52px] bg-card group")}>
            {!isReadOnly && employee.id !== 'unassigned' && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:opacity-100 opacity-0 transition-opacity" />}
            <div className="flex items-center gap-3">
                 {employee.id !== 'unassigned' ? (
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={employee.avatar} data-ai-hint="profile avatar" />
                        <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(employee)) }}>
                        {getInitials(getFullName(employee))}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="w-9 h-9 flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                )}
                <div>
                    <p className="font-semibold text-sm">{getFullName(employee)}</p>
                </div>
            </div>
        </div>

        {/* Day Cells for Shifts */}
        {days.map((day) => {
        const itemsForDay = [
            ...shifts.filter(
                (s) => (s.employeeId === employee.id || (employee.id === 'unassigned' && s.employeeId === null)) && isSameDay(new Date(s.date), day)
            ),
            ...leave.filter(
                (l) => l.employeeId === employee.id && isSameDay(new Date(l.date), day)
            ).map(l => {
                const leaveType = leaveTypes.find(lt => lt.type === l.type);
                return { ...l, color: leaveType?.color || l.color };
            })
        ];
        return (
            <div
            key={`${employee.id}-${day.toISOString()}`}
            className={cn("group/cell col-start-auto p-1 border-b border-l min-h-[52px] space-y-1 bg-background/30 relative",
             viewMode === 'month' && day.getMonth() !== currentDate.getMonth() && 'bg-muted/50',
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleShiftDrop(e, employee.id === 'unassigned' ? null : employee.id, day)}
            >
            {itemsForDay.map((item) => (
                <div key={item.id} draggable={!isReadOnly} onDragStart={(e) => handleShiftDragStart(e, item)} className="h-full">
                    <ShiftBlock
                    item={item}
                    onClick={() => !isReadOnly && handleEditItemClick(item)}
                    context="week"
                    />
                </div>
            ))}
            {itemsForDay.length === 0 && !isReadOnly && (
                <Button variant="ghost" className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity" onClick={() => handleEmptyCellClick(employee.id === 'unassigned' ? null : employee.id, day)}>
                <PlusCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
            )}
            </div>
        );
        })}
    </div>
  )

  return (
    <Card className="h-full flex flex-col">
       <CardHeader>
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Drag and drop shifts, manage time off, and publish the schedule for your team.</CardDescription>
            </div>
             {!isReadOnly && (
            <div className="flex items-center gap-2">
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Actions
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                           <DropdownMenuItem onClick={handleSaveDraft}>
                                <Save className="mr-2 h-4 w-4" />
                                <span>Save Draft</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={onPublish}>
                                <Send className="mr-2 h-4 w-4" />
                                <span>Publish</span>
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => setIsImporterOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Import Schedule</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsTemplateImporterOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Import Templates</span>
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
                             <DropdownMenuItem onClick={() => setIsLeaveTypeEditorOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Manage Leave Types</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onManageHolidays}>
                                <PartyPopper className="mr-2 h-4 w-4" />
                                <span>Manage Holidays</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                         <DropdownMenuSeparator />
                         <DropdownMenuGroup>
                             <DropdownMenuItem onClick={generateAttendanceSheetExcel} disabled={viewMode !== 'week'}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download Attendance Sheet</span>
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => isClient && setIsTemplateUploaderOpen(true)} disabled={viewMode !== 'week'}>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Upload Attendance Template</span>
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => isClient && setIsEmailDialogOpen(true)} disabled={viewMode !== 'week'}>
                                <Mail className="mr-2 h-4 w-4" />
                                <span>Email Attendance Sheet</span>
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
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full justify-end mt-4">
           <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
           <Popover>
              <PopoverTrigger asChild>
              <Button
                  id="date"
                  variant={'outline'}
                  className={cn('w-full md:w-[260px] justify-start text-left font-normal text-sm')}
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
      </CardHeader>
    
      <CardContent className="flex-1 p-0 overflow-auto">
        <div className="relative h-full overflow-auto shadow-md rounded-lg">
            {viewMode === 'month' ? (
                <div className="space-y-4">
                  {weeksOfMonth.map((week, index) => (
                      <div key={index} className="grid" style={{ gridTemplateColumns: `minmax(180px, 1.5fr) repeat(7, minmax(140px, 1fr))` }}>
                          {renderGridHeader(week)}
                          {renderNotesRow(week)}
                          {orderedEmployees.map((employee) => renderEmployeeRow(employee, week))}
                      </div>
                  ))}
                </div>
            ) : (
                <div className="grid" style={{ gridTemplateColumns: `minmax(180px, 1.5fr) repeat(${displayedDays.length}, minmax(140px, 1fr))` }}>
                  {renderGridHeader(displayedDays)}
                  {renderNotesRow(displayedDays)}
                  {orderedEmployees.map((employee) => renderEmployeeRow(employee, displayedDays))}
                </div>
            )}
        </div>
      </CardContent>

      <ShiftEditor
        isOpen={isShiftEditorOpen}
        setIsOpen={setIsShiftEditorOpen}
        shift={editingShift}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        employees={employees}
        shiftTemplates={shiftTemplates}
        setShiftTemplates={setShiftTemplates}
        tasks={tasks}
        setTasks={setTasks}
        currentUser={currentUser}
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
      {isClient && isEmailDialogOpen && (
        <EmailDialog
            isOpen={isEmailDialogOpen}
            setIsOpen={setIsEmailDialogOpen}
            subject={`Attendance Sheet - ${format(dateRange.from, 'MMM d')} to ${format(dateRange.to, 'MMM d, yyyy')}`}
            smtpSettings={smtpSettings}
            generateExcelData={generateAttendanceSheetExcel}
            fileName={`${currentUser.group} Attendance Sheet - ${format(dateRange.from, 'MM-dd-yyyy')}.xlsx`}
        />
      )}
       <AttendanceTemplateUploader
            isOpen={isTemplateUploaderOpen}
            setIsOpen={setIsTemplateUploaderOpen}
            onTemplateUpload={setAttendanceTemplate}
        />
    </Card>
  );
}


function EmailDialog({ isOpen, setIsOpen, subject, smtpSettings, generateExcelData, fileName }: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    subject: string;
    smtpSettings: SmtpSettings;
    generateExcelData: () => Promise<string>;
    fileName: string;
}) {
    const [to, setTo] = useState('');
    const [isSending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const htmlBody = `<p>Please find the attendance sheet attached.</p>`;

    const handleSend = () => {
        if (!to) {
            toast({ variant: 'destructive', title: 'Recipient required', description: 'Please enter an email address.' });
            return;
        }
        
        startTransition(async () => {
            const excelData = await generateExcelData();
            if (!excelData) {
                 toast({ variant: 'destructive', title: 'Cannot Send', description: 'The report could not be generated. Please check your settings and try again.' });
                 return;
            }

            const attachments = [{
                filename: fileName,
                content: excelData,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }];

            const result = await sendEmail({ to, subject, htmlBody, attachments }, smtpSettings);
            if (result.success) {
                toast({ title: 'Email Sent', description: `Report sent to ${to}.` });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Email Failed', description: result.error });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Report via Email</DialogTitle>
                    <DialogDescription>The attendance sheet will be sent as an Excel attachment.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipientEmail">Recipient Email</Label>
                        <Input id="recipientEmail" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
                    </div>
                     <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={subject} readOnly disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Body</Label>
                         <div className="h-24 rounded-md border p-2 text-sm" dangerouslySetInnerHTML={{ __html: htmlBody }} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isSending}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
