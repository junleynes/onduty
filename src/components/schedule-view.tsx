'use client';

import React, { useState, useMemo } from 'react';
import { addDays, format, eachDayOfInterval, isSameDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Card, CardContent } from '@/components/ui/card';
import { shifts as initialShifts, employees } from '@/lib/data';
import type { Employee, Shift } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { PlusCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ShiftEditor } from './shift-editor';

const roleColors: { [key: string]: string } = {
  Manager: 'hsl(var(--accent))',
  Chef: 'hsl(var(--chart-1))',
  Barista: 'hsl(var(--chart-2))',
  Cashier: 'hsl(var(--chart-3))',
};

export default function ScheduleView() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 6, 21), // July 21, 2024
    to: addDays(new Date(2024, 6, 21), 6),
  });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | Partial<Shift> | null>(null);

  const handleAddShiftClick = () => {
    setEditingShift({});
    setIsEditorOpen(true);
  };

  const handleEditShiftClick = (shift: Shift) => {
    setEditingShift(shift);
    setIsEditorOpen(true);
  };

  const handleSaveShift = (savedShift: Shift) => {
    if ('id' in savedShift && savedShift.id) {
      // Update existing shift
      setShifts(shifts.map(s => s.id === savedShift.id ? savedShift : s));
    } else {
      // Add new shift
      const newShiftWithId = { ...savedShift, id: `sh-${Date.now()}` };
      setShifts([...shifts, newShiftWithId as Shift]);
    }
    setIsEditorOpen(false);
    setEditingShift(null);
  };
  
  const displayedDays = useMemo(() => {
    if (date?.from && date?.to) {
      return eachDayOfInterval({ start: date.from, end: date.to });
    }
    return [];
  }, [date]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Job Scheduler</h1>
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
          <div className="flex items-center gap-1 rounded-md border bg-card p-1">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'ghost'}
                  className={cn(
                    'w-[260px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleAddShiftClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Shift
          </Button>
          <Button variant="outline">Publish</Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[250px_repeat(7,1fr)]">
            {/* Header Row */}
            <div className="sticky top-0 z-10 p-3 bg-card border-b border-r">
              <span className="font-semibold">Employees</span>
            </div>
            {displayedDays.map((day) => (
              <div key={day.toISOString()} className="sticky top-0 z-10 col-start-auto p-3 text-center font-semibold bg-card border-b border-l">
                <div className="text-sm text-muted-foreground">{format(day, 'E')}</div>
                <div className="text-xl">{format(day, 'd')}</div>
              </div>
            ))}

            {/* Employee Rows */}
            {employees.map((employee) => (
              <React.Fragment key={employee.id}>
                {/* Employee Cell */}
                <div className="p-3 border-b border-r flex items-center gap-3 min-h-[80px]">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="profile avatar" />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                </div>

                {/* Day Cells for Shifts */}
                {displayedDays.map((day) => {
                  const employeeShifts = shifts.filter(
                    (s) => s.employeeId === employee.id && isSameDay(s.date, day)
                  );
                  return (
                    <div
                      key={`${employee.id}-${day.toISOString()}`}
                      className="col-start-auto p-2 border-b border-l min-h-[80px] space-y-1"
                    >
                      {employeeShifts.map((shift) => (
                        <button
                          key={shift.id}
                          onClick={() => handleEditShiftClick(shift)}
                          className="w-full p-2 rounded-md text-left"
                          style={{ backgroundColor: shift.color || roleColors[employee.role] }}
                        >
                          <p className="font-bold text-xs text-card-foreground/80">
                            {shift.startTime} - {shift.endTime}
                          </p>
                          <p className="text-xs text-card-foreground/60">
                            {employee.role} Shift
                          </p>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <ShiftEditor
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        shift={editingShift}
        onSave={handleSaveShift}
        employees={employees}
      />
      
    </div>
  );
}
