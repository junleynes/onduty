'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { shifts, getEmployeeById, weekDays } from '@/lib/data';
import { Calendar, Clock, User } from 'lucide-react';
import type { Shift } from '@/types';

// Let's assume the logged-in employee is 'emp-003' (Charlie Brown) for demonstration
const LOGGED_IN_EMPLOYEE_ID = 'emp-003';

export default function MyScheduleView() {
  const myShifts = shifts.filter(shift => shift.employeeId === LOGGED_IN_EMPLOYEE_ID);
  const employee = getEmployeeById(LOGGED_IN_EMPLOYEE_ID);

  const shiftsByDay = weekDays.map(day => ({
    day,
    shifts: myShifts.filter(shift => shift.day === day),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Upcoming Shifts</CardTitle>
        <CardDescription>Here is your schedule for the upcoming week, {employee?.name.split(' ')[0]}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shiftsByDay.map(({ day, shifts }) => (
            <div key={day}>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> {day}</h3>
              {shifts.length > 0 ? (
                <div className="space-y-4">
                  {shifts.map(shift => {
                    const shiftEmployee = getEmployeeById(shift.employeeId);
                    return (
                      <Card key={shift.id} className="bg-primary/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-primary" />
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
              ) : (
                <p className="text-muted-foreground italic text-sm">No shifts scheduled.</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
