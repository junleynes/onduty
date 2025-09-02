
'use client';

import React, { useState, useEffect } from 'react';
import type { Employee, Shift } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { isSameDay, parse, subDays } from 'date-fns';
import { Clock, Phone, Mail, LayoutGrid, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getPublicData } from '@/app/actions';

type ActiveShift = {
  employee: Employee;
  shift: Shift;
};

export default function OndutyPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
        try {
            const result = await getPublicData();
            if (result.success && result.data) {
                setEmployees(result.data.employees);
                setShifts(result.data.shifts);
            } else {
                setError(result.error || "Failed to load public data.");
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const activeShifts: ActiveShift[] = [];

  const today = currentTime;
  const yesterday = subDays(today, 1);
  const relevantDays = [today, yesterday];

  shifts.forEach(shift => {
    if (!shift.employeeId) return;
    
    const shiftDate = new Date(shift.date);

    // Only consider shifts from today or yesterday to catch overnight shifts
    if (!relevantDays.some(relevantDay => isSameDay(shiftDate, relevantDay))) return;

    const startTime = parse(shift.startTime, 'HH:mm', shiftDate);
    let endTime = parse(shift.endTime, 'HH:mm', shiftDate);

    // Handle overnight shifts by adding a day to the end time
    if (endTime < startTime) {
      endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    }
    
    if (currentTime >= startTime && currentTime <= endTime) {
      const employee = employees.find(e => e.id === shift.employeeId);
      if (employee) {
        activeShifts.push({ employee, shift });
      }
    }
  });

  const groupedActiveShifts = activeShifts.reduce((acc, { employee, shift }) => {
    const groupName = employee.group || 'Unassigned';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push({ employee, shift });
    return acc;
  }, {} as Record<string, ActiveShift[]>);

  // Sort employees within each group
  for (const groupName in groupedActiveShifts) {
    groupedActiveShifts[groupName].sort((a, b) => a.employee.lastName.localeCompare(b.employee.lastName));
  }

  const groupOrder = Object.keys(groupedActiveShifts).sort();
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
      )
    }
    
    if (error) {
         return (
            <Card>
                <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-center text-destructive p-8 border-2 border-dashed border-destructive rounded-lg">
                    Could not load On Duty information. {error}
                </p>
                </CardContent>
            </Card>
        )
    }
    
    if (groupOrder.length > 0) {
       return groupOrder.map(groupName => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle>{groupName} On Duty</CardTitle>
                <CardDescription>
                  Team members currently on shift as of {currentTime.toLocaleTimeString()}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedActiveShifts[groupName].map(({ employee, shift }) => (
                    <Card key={employee.id} className="shadow-md">
                      <CardContent className="p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-primary">
                            <AvatarImage src={employee.avatar || undefined} data-ai-hint="profile avatar" />
                            <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(employee)) }} className="text-xl">
                              {getInitials(getFullName(employee))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-lg">{getFullName(employee)}</p>
                            <p className="text-muted-foreground">{employee.position}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" /> 
                            <span>{shift.startTime} - {shift.endTime} ({shift.label})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" /> 
                            <a href={`mailto:${employee.email}`} className="text-primary hover:underline">{employee.email}</a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" /> 
                            <a href={`tel:${employee.phone}`} className="hover:underline">{employee.phone}</a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
        ));
    }
    
     return (
        <Card>
            <CardHeader>
            <CardTitle>No One On Duty</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                There are currently no team members on a published shift.
            </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-primary">
            <LayoutGrid className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">OnDuty</h1>
        </Link>
      </header>
      <main className="space-y-6">
        {renderContent()}
      </main>
      <footer className="text-center text-muted-foreground text-sm mt-8">
        <p>&copy; {new Date().getFullYear()} OnDuty. All rights reserved.</p>
      </footer>
    </div>
  );
}
