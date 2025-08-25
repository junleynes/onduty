'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { shifts, weekDays, getEmployeeById } from '@/lib/data';
import type { Shift } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    Manager: 'default',
    Chef: 'destructive',
    Barista: 'secondary',
    Cashier: 'outline',
  };
  
export default function ScheduleView() {
  const timeSlots = Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
        <CardDescription>A visual overview of the weekly shift schedule.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
            <div className="grid grid-cols-[auto_repeat(7,1fr)]">
                <div className="row-start-1 sticky top-0 bg-background z-10">&nbsp;</div>
                {weekDays.map(day => (
                  <div key={day} className="col-start-auto row-start-1 p-2 text-center font-semibold sticky top-0 bg-background z-10 border-b">
                    {day}
                  </div>
                ))}

                <div className="col-start-1 grid">
                    {timeSlots.map(time => (
                        <div key={time} className="h-20 flex items-center pr-2">
                             <span className="text-xs text-muted-foreground">{time}</span>
                        </div>
                    ))}
                </div>

                {weekDays.map((day, dayIndex) => (
                    <div key={day} className="col-start-auto relative grid" style={{gridTemplateRows: `repeat(${timeSlots.length}, 5rem)`}}>
                         {/* Grid lines */}
                        {timeSlots.map((time, timeIndex) => (
                          <div key={`${day}-${time}`} className="border-t border-l"></div>
                        ))}

                        {/* Shifts */}
                        {shifts
                            .filter(shift => shift.day === day)
                            .map(shift => {
                                const employee = getEmployeeById(shift.employeeId);
                                if (!employee) return null;

                                const startHour = parseInt(shift.startTime.split(':')[0]);
                                const endHour = parseInt(shift.endTime.split(':')[0]);
                                const duration = endHour - startHour;
                                const top = (startHour - 8) * 5; // 5rem per hour, starting from 8:00

                                return (
                                    <div
                                        key={shift.id}
                                        className="absolute w-full p-1"
                                        style={{ top: `${top}rem`, height: `${duration * 5}rem` }}
                                    >
                                        <div className="bg-card rounded-lg p-2 shadow-sm border-l-4 border-primary h-full flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={`https://placehold.co/32x32.png`} data-ai-hint="profile picture" />
                                                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-semibold text-sm truncate">{employee.name}</p>
                                                </div>
                                                <Badge variant={roleColors[employee.role]} className="mb-1">{employee.role}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{shift.startTime} - {shift.endTime}</p>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
