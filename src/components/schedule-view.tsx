'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        <CardDescription>Drag and drop shifts to assign or modify the schedule. (UI representation)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Time</TableHead>
                {weekDays.map(day => (
                  <TableHead key={day} className="text-center">{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map(time => (
                <TableRow key={time}>
                  <TableCell className="font-medium text-muted-foreground">{time}</TableCell>
                  {weekDays.map(day => (
                    <TableCell key={`${day}-${time}`} className="h-20 p-1 align-top border-l">
                      <div className="grid grid-cols-1 gap-1">
                        {shifts
                          .filter(shift => shift.day === day && shift.startTime === time)
                          .map(shift => {
                            const employee = getEmployeeById(shift.employeeId);
                            if (!employee) return null;

                            const startHour = parseInt(shift.startTime.split(':')[0]);
                            const endHour = parseInt(shift.endTime.split(':')[0]);
                            const duration = endHour - startHour;

                            return (
                                <div
                                    key={shift.id}
                                    className="bg-card rounded-lg p-2 shadow-sm border-l-4 border-primary cursor-pointer hover:shadow-md transition-shadow"
                                    style={{ height: `${duration * 5}rem` }}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={`https://placehold.co/32x32.png`} data-ai-hint="profile picture" />
                                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-semibold text-sm truncate">{employee.name}</p>
                                    </div>
                                    <Badge variant={roleColors[employee.role]}>{employee.role}</Badge>
                                    <p className="text-xs text-muted-foreground mt-1">{shift.startTime} - {shift.endTime}</p>
                                </div>
                            );
                          })}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
