
'use client';

import React from 'react';
import type { Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { Cake, PartyPopper, Gift } from 'lucide-react';
import { format, isSameDay, isWithinInterval, add, getMonth, getDate, getYear, startOfDay } from 'date-fns';

type CelebrationsViewProps = {
  employees: Employee[];
};

const CelebrationItem = ({ employee, type }: { employee: Employee; type: 'birthday' | 'anniversary' }) => {
  const originalDate = type === 'birthday' ? employee.birthDate : employee.startDate;
  if (!originalDate) return null;
  
  const date = new Date(originalDate);

  const today = startOfDay(new Date());
  
  // Set the celebration date to this year for comparison
  const celebrationDateThisYear = new Date(date);
  celebrationDateThisYear.setFullYear(today.getFullYear());

  const years = today.getFullYear() - getYear(date);
  const isBirthday = type === 'birthday';
  const celebrationText = isBirthday ? `Turns ${years}` : `Work Anniversary (${years} years)`;
  
  // For anniversaries, don't show if it's their start year
  if (!isBirthday && years === 0) return null;

  return (
    <li className="flex items-center gap-4 py-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={employee.avatar} data-ai-hint="profile avatar" />
        <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(employee)) }}>
          {getInitials(getFullName(employee))}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold">{getFullName(employee)}</p>
        <p className="text-sm text-muted-foreground">{employee.position}</p>
      </div>
      <div className="text-right">
        <p className="font-medium">{format(date, 'MMMM d')}</p>
        <p className="text-sm text-muted-foreground">{celebrationText}</p>
      </div>
    </li>
  );
};


export default function CelebrationsView({ employees }: CelebrationsViewProps) {
  const today = startOfDay(new Date());
  const nextMonth = add(today, { days: 30 });
  const interval = { start: today, end: nextMonth };

  const upcomingBirthdays: Employee[] = [];
  const upcomingAnniversaries: Employee[] = [];

  employees.forEach(employee => {
    // Check birthdays
    if (employee.birthDate) {
      const birthDate = new Date(employee.birthDate);
      let celebrationDateThisYear = new Date(birthDate);
      celebrationDateThisYear.setFullYear(today.getFullYear());

      if (celebrationDateThisYear < today) {
          celebrationDateThisYear.setFullYear(today.getFullYear() + 1);
      }
      
      if(isWithinInterval(celebrationDateThisYear, interval)) {
          upcomingBirthdays.push(employee);
      }
    }

    // Check anniversaries
    if (employee.startDate) {
      const startDate = new Date(employee.startDate);
       if (getYear(startDate) === getYear(today)) return; // No anniversary in the first year
      
      let anniversaryDateThisYear = new Date(startDate);
      anniversaryDateThisYear.setFullYear(today.getFullYear());

      if (anniversaryDateThisYear < today) {
        anniversaryDateThisYear.setFullYear(today.getFullYear() + 1);
      }
      
       if(isWithinInterval(anniversaryDateThisYear, interval)) {
          upcomingAnniversaries.push(employee);
      }
    }
  });

  const sortFn = (a: Employee, b: Employee, type: 'birthday' | 'anniversary') => {
      const dateA = new Date(type === 'birthday' ? a.birthDate! : a.startDate!);
      const dateB = new Date(type === 'birthday' ? b.birthDate! : b.startDate!);
      
      let nextDateA = new Date(dateA.setFullYear(today.getFullYear()));
      if (nextDateA < today) nextDateA.setFullYear(today.getFullYear() + 1);

      let nextDateB = new Date(dateB.setFullYear(today.getFullYear()));
      if (nextDateB < today) nextDateB.setFullYear(today.getFullYear() + 1);

      return nextDateA.getTime() - nextDateB.getTime();
  }

  upcomingBirthdays.sort((a,b) => sortFn(a,b, 'birthday'));
  upcomingAnniversaries.sort((a,b) => sortFn(a,b, 'anniversary'));


  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
             <Cake className="h-6 w-6 text-pink-500" />
            <div>
                <CardTitle>Upcoming Birthdays</CardTitle>
                <CardDescription>Celebrating in the next 30 days.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           {upcomingBirthdays.length > 0 ? (
             <ul className="divide-y">
                {upcomingBirthdays.map(emp => <CelebrationItem key={`${emp.id}-bday`} employee={emp} type="birthday" />)}
             </ul>
            ) : (
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>No birthdays in the next 30 days.</p>
             </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <PartyPopper className="h-6 w-6 text-yellow-500" />
                <div>
                    <CardTitle>Work Anniversaries</CardTitle>
                    <CardDescription>Celebrating in the next 30 days.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
           {upcomingAnniversaries.length > 0 ? (
             <ul className="divide-y">
                {upcomingAnniversaries.map(emp => <CelebrationItem key={`${emp.id}-anniv`} employee={emp} type="anniversary" />)}
             </ul>
            ) : (
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>No work anniversaries in the next 30 days.</p>
             </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
