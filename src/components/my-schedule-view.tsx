'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { shifts, getEmployeeById, weekDays } from '@/lib/data';
import { Calendar, Clock, User } from 'lucide-react';
import type { Shift } from '@/types';
import { format } from 'date-fns';

// Let's assume the logged-in employee is 'emp-003' (Charlie Brown) for demonstration
const LOGGED_IN_EMPLOYEE_ID = 'emp-003';

const roleColors: { [key: string]: string } = {
  Manager: 'bg-accent/50 border-accent',
  Chef: 'bg-red-100 border-red-200',
  Barista: 'bg-blue-100 border-blue-200',
  Cashier: 'bg-green-100 border-green-200',
};

export default function MyScheduleView() {
  const myShifts = shifts.filter(shift => shift.employeeId === LOGGED_IN_EMPLOYEE_ID);
  const employee = getEmployeeById(LOGGED_IN_EMPLOYEE_ID);

  // Group shifts by date
  const shiftsByDate = myShifts.reduce((acc, shift) => {
    const dateStr = format(shift.date, 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const sortedDates = Object.keys(shiftsByDate).sort();


  return (
    <Card>
      <CardHeader>
        <CardTitle>My Upcoming Shifts</CardTitle>
        <CardDescription>Here is your schedule for the upcoming week, {employee?.name.split(' ')[0]}.</CardDescription>
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
                    <Card key={shift.id} className={`${roleColors[shiftEmployee.role]} border-l-4`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-6 w-6 text-foreground/80" />
                          <div>
                            <p className="font-bold text-base">{shift.startTime} - {shift.endTime}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-4 w-4" /> Role: {shiftEmployee?.role}
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
