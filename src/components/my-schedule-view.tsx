'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { shifts, getEmployeeById } from '@/lib/data';
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Shift } from '@/types';
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';

type ViewMode = 'day' | 'week';

// Let's assume the logged-in employee is 'emp-003' (Charlie Brown) for demonstration
const LOGGED_IN_EMPLOYEE_ID = 'emp-003';

const roleColors: { [key: string]: string } = {
  Manager: 'bg-accent/50 border-accent',
  Chef: 'bg-red-100 border-red-200',
  Barista: 'bg-blue-100 border-blue-200',
  Cashier: 'bg-green-100 border-green-200',
};

export default function MyScheduleView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const myShifts = shifts.filter(shift => shift.employeeId === LOGGED_IN_EMPLOYEE_ID);
  const employee = getEmployeeById(LOGGED_IN_EMPLOYEE_ID);

  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    }
    return { start: currentDate, end: currentDate };
  }, [currentDate, viewMode]);

  const shiftsToDisplay = myShifts.filter(shift => 
    shift.date >= dateRange.start && shift.date <= dateRange.end
  );

  const shiftsByDate = shiftsToDisplay.reduce((acc, shift) => {
    const dateStr = format(shift.date, 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const sortedDates = Object.keys(shiftsByDate).sort();

  const navigateDate = (direction: 'prev' | 'next') => {
    const daysToAdd = viewMode === 'week' ? 7 : 1;
    setCurrentDate(prev => addDays(prev, direction === 'prev' ? -daysToAdd : daysToAdd));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>My Upcoming Shifts</CardTitle>
            <CardDescription>Here is your schedule, {employee?.firstName}.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedDates.length > 0 ? sortedDates.map((dateStr) => (
            <div key={dateStr}>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> {format(new Date(dateStr), 'E, LLL d')}
              </h3>
              <div className="space-y-4">
                {shiftsByDate[dateStr].map(shift => {
                  const shiftEmployee = getEmployeeById(shift.employeeId);
                  if (!shiftEmployee) return null;
                  return (
                    <Card key={shift.id} className={`${roleColors[shiftEmployee.position] || ''} border-l-4`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-6 w-6 text-foreground/80" />
                          <div>
                            <p className="font-bold text-base">{shift.startTime} - {shift.endTime}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-4 w-4" /> Role: {shiftEmployee?.position}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )) : (
             <p className="text-muted-foreground italic text-sm col-span-full text-center mt-8">No shifts scheduled for the selected period.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
