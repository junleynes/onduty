
'use client';

import React, { useState, useMemo } from 'react';
import { addDays, format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { shifts as initialShifts, employees, leave as initialLeave } from '@/lib/data';
import type { Employee, Shift, Leave } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { PlusCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Copy, CircleSlash, UserX, Download, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ShiftEditor } from './shift-editor';
import { LeaveEditor } from './leave-editor';
import { Progress } from './ui/progress';
import { ShiftBlock } from './shift-block';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function ScheduleView() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [leave, setLeave] = useState<Leave[]>(initialLeave);
  
  const [currentDate, setCurrentDate] = useState(new Date(2024, 6, 21)); // July 21, 2024
  const [isShiftEditorOpen, setIsShiftEditorOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | Partial<Shift> | null>(null);

  const [isLeaveEditorOpen, setIsLeaveEditorOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Partial<Leave> | null>(null);
  
  const [weekTemplate, setWeekTemplate] = useState<Omit<Shift, 'id' | 'date'>[] | null>(null);
  const { toast } = useToast();

  const dateRange = useMemo(() => ({
      from: startOfWeek(currentDate, { weekStartsOn: 1 }), // Monday
      to: endOfWeek(currentDate, { weekStartsOn: 1 }),
  }), [currentDate]);
  
  const displayedDays = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    }
    return [];
  }, [dateRange]);

  const handleAddShiftClick = () => {
    setEditingShift({});
    setIsShiftEditorOpen(true);
  };
  
  const handleAddLeaveClick = () => {
    setEditingLeave({ type: 'Time Off Request', isAllDay: true });
    setIsLeaveEditorOpen(true);
  };

  const handleEmptyCellClick = (employeeId: string | null, date: Date) => {
    setEditingShift({ employeeId, date });
    setIsShiftEditorOpen(true);
  };

  const handleEditItemClick = (item: Shift | Leave) => {
    if ('label' in item) { // It's a shift
        setEditingShift(item);
        setIsShiftEditorOpen(true);
    } else { // It's leave
        setEditingLeave(item);
        setIsLeaveEditorOpen(true);
    }
  };

  const handleSaveShift = (savedShift: Shift | Partial<Shift>) => {
    if ('id' in savedShift && savedShift.id) {
      // Update existing shift
      setShifts(shifts.map(s => s.id === savedShift.id ? savedShift as Shift : s));
    } else {
      // Add new shift
      const newShiftWithId = { ...savedShift, id: `sh-${Date.now()}` };
      setShifts([...shifts, newShiftWithId as Shift]);
    }
    setIsShiftEditorOpen(false);
    setEditingShift(null);
  };
  
  const handleDeleteShift = (shiftId: string) => {
    setShifts(shifts.filter(s => s.id !== shiftId));
    setIsShiftEditorOpen(false);
    setEditingShift(null);
    toast({ title: "Shift Deleted", variant: "destructive" });
  };


  const handleSaveLeave = (savedLeave: Leave | Partial<Leave>) => {
    if ('id' in savedLeave && savedLeave.id) {
      // Update existing leave
      setLeave(leave.map(l => l.id === savedLeave.id ? savedLeave as Leave : l));
    } else {
      // Add new leave
      const newLeaveWithId = { ...savedLeave, id: `leave-${Date.now()}` };
      setLeave([...leave, newLeaveWithId as Leave]);
    }
    setIsLeaveEditorOpen(false);
    setEditingLeave(null);
  };
  
  const handleDeleteLeave = (leaveId: string) => {
    setLeave(leave.filter(l => l.id !== leaveId));
    setIsLeaveEditorOpen(false);
    setEditingLeave(null);
    toast({ title: "Leave Deleted", variant: "destructive" });
  };


  const navigateWeek = (direction: 'prev' | 'next') => {
      const newDate = addDays(currentDate, direction === 'prev' ? -7 : 7);
      setCurrentDate(newDate);
  }
  
  // Action handlers
  const handleClearWeek = () => {
    setShifts(currentShifts => currentShifts.filter(shift => !displayedDays.some(day => isSameDay(shift.date, day))));
    toast({ title: "Week Cleared", description: "All shifts for the current week have been removed." });
  };

  const handleUnassignWeek = () => {
    setShifts(currentShifts => currentShifts.map(shift => 
      displayedDays.some(day => isSameDay(shift.date, day)) 
        ? { ...shift, employeeId: null } 
        : shift
    ));
    toast({ title: "Week Unassigned", description: "All shifts for the current week have been moved to unassigned." });
  };

  const handleCopyPreviousWeek = () => {
    const prevWeekStart = subDays(dateRange.from, 7);
    const prevWeekEnd = subDays(dateRange.to, 7);
    const prevWeekShifts = shifts.filter(shift => shift.date >= prevWeekStart && shift.date <= prevWeekEnd);

    const newShifts = prevWeekShifts.map(shift => ({
      ...shift,
      id: `sh-${Date.now()}-${Math.random()}`,
      date: addDays(shift.date, 7)
    }));

    setShifts(currentShifts => [...currentShifts, ...newShifts]);
    toast({ title: "Previous Week Copied", description: "Shifts from the previous week have been copied over." });
  };

  const handleSaveTemplate = () => {
    const shiftsInView = shifts.filter(shift => displayedDays.some(day => isSameDay(shift.date, day)));
    const template = shiftsInView.map(({ id, date, ...rest }) => ({
      ...rest,
      dayOfWeek: date.getDay(), // 0 for Sunday, 1 for Monday, etc.
    }));
    setWeekTemplate(template as any); // Type casting to avoid complex dayOfWeek type
    toast({ title: "Template Saved", description: "Current week's layout has been saved as a template." });
  };

  const handleLoadTemplate = () => {
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
        };
    }).filter(Boolean);

    setShifts([...shiftsOutsideCurrentWeek, ...newShifts as Shift[]]);
    toast({ title: "Template Loaded", description: "The saved template has been applied to the current week." });
  };


  const allEmployees = [{ id: 'unassigned', name: 'Unassigned Shifts', role: 'Special', avatar: '' }, ...employees];

  const calculateDailyHours = (day: Date) => {
    const dailyShifts = shifts.filter(s => isSameDay(s.date, day));
    return dailyShifts.reduce((acc, shift) => {
        if (!shift.startTime || !shift.endTime) return acc;
        const start = parseInt(shift.startTime.split(':')[0]);
        const end = parseInt(shift.endTime.split(':')[0]);
        return acc + (end - start);
    }, 0);
  }

  const dailyShiftCount = (day: Date) => {
    return shifts.filter(s => isSameDay(s.date, day)).length;
  }

  const dailyEmployeeCount = (day: Date) => {
    return new Set(shifts.filter(s => isSameDay(s.date, day) && s.employeeId).map(s => s.employeeId)).size;
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, shiftId: string) => {
    e.dataTransfer.setData("shiftId", shiftId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetEmployeeId: string | null, targetDate: Date) => {
    e.preventDefault();
    const shiftId = e.dataTransfer.getData("shiftId");
    
    setShifts(prevShifts => 
      prevShifts.map(shift =>
        shift.id === shiftId
          ? { ...shift, employeeId: targetEmployeeId, date: targetDate }
          : shift
      )
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn('w-[280px] justify-start text-left font-normal')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
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
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Select defaultValue="week">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleAddShiftClick}>Add Shift</DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddLeaveClick}>Add Time Off</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleCopyPreviousWeek}>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copy previous week</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClearWeek}>
                        <CircleSlash className="mr-2 h-4 w-4" />
                        <span>Clear week</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleUnassignWeek}>
                        <UserX className="mr-2 h-4 w-4" />
                        <span>Unassign week</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleSaveTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Save week as template</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLoadTemplate}>
                        <Upload className="mr-2 h-4 w-4" />
                        <span>Load week template</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    
    <div className="flex-1 overflow-auto">
      <Card className="h-full">
        <CardContent className="p-0">
          <div className="grid" style={{gridTemplateColumns: `250px repeat(${displayedDays.length}, 1fr)`}}>
            {/* Header Row */}
            <div className="sticky top-0 z-10 p-3 bg-card border-b border-r">
              <span className="font-semibold">Employees</span>
            </div>
            {displayedDays.map((day) => (
              <div key={day.toISOString()} className="sticky top-0 z-10 col-start-auto p-3 text-center font-semibold bg-card border-b border-l">
                <div className="text-xl">{format(day, 'E d')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                    {dailyShiftCount(day)} shifts, {dailyEmployeeCount(day)} users
                </div>
                <Progress value={(calculateDailyHours(day) / 40) * 100} className="h-1 mt-1"/>
                <div className="text-xs font-normal text-muted-foreground">{calculateDailyHours(day)} hrs</div>
              </div>
            ))}

            {/* Employee Rows */}
            {allEmployees.map((employee) => (
              <React.Fragment key={employee.id}>
                {/* Employee Cell */}
                <div className="p-3 border-b border-r flex items-center gap-3 min-h-[80px] sticky left-0 bg-card z-10">
                  {employee.id !== 'unassigned' ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="profile avatar" />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  ) : <div className="w-10 h-10"/>}
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                </div>

                {/* Day Cells for Shifts */}
                {displayedDays.map((day) => {
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
                      className="group/cell col-start-auto p-2 border-b border-l min-h-[80px] space-y-1 bg-background/30 relative"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, employee.id === 'unassigned' ? null : employee.id, day)}
                    >
                      {itemsForDay.map((item) => (
                        <div key={item.id} draggable onDragStart={(e) => 'label' in item && handleDragStart(e, item.id)}>
                          <ShiftBlock
                            item={item}
                            onClick={() => handleEditItemClick(item)}
                          />
                        </div>
                      ))}
                      {itemsForDay.length === 0 && (
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
      />
      <LeaveEditor
        isOpen={isLeaveEditorOpen}
        setIsOpen={setIsLeaveEditorOpen}
        leave={editingLeave}
        onSave={handleSaveLeave}
        onDelete={handleDeleteLeave}
        employees={employees}
      />
    </div>
  );
}
