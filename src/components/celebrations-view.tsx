
'use client';

import React from 'react';
import type { Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { Cake, PartyPopper } from 'lucide-react';
import { format, isWithinInterval, add, getYear, startOfDay, differenceInYears } from 'date-fns';

type CelebrationsViewProps = {
  employees: Employee[];
};

type CelebrationType = 'birthday' | 'anniversary';

type Celebration = {
  employee: Employee;
  date: Date;
  type: CelebrationType;
  celebrationText: string;
};

const CelebrationItem = ({ celebration }: { celebration: Celebration }) => {
  const { employee, date, celebrationText } = celebration;
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

  const upcomingBirthdays: Celebration[] = [];
  const upcomingAnniversaries: Celebration[] = [];
  

  employees.forEach(employee => {
    // Check birthdays
    if (employee.birthDate) {
      const birthDate = new Date(employee.birthDate);
      let celebrationDateThisYear = new Date(birthDate.setFullYear(today.getFullYear()));

      if (celebrationDateThisYear < today) {
          celebrationDateThisYear.setFullYear(today.getFullYear() + 1);
      }
      
      if(isWithinInterval(celebrationDateThisYear, interval)) {
          const years = differenceInYears(celebrationDateThisYear, birthDate);
          upcomingBirthdays.push({
              employee,
              date: birthDate,
              type: 'birthday',
              celebrationText: `Turns ${years}`
          });
      }
    }
    
    // Check milestone anniversaries
    if (employee.startDate) {
        const startDate = new Date(employee.startDate);
        const yearsOfService = differenceInYears(today, startDate);
        const anniversaryYear = yearsOfService + 1; // We are looking for the *upcoming* anniversary

        const isMilestone = anniversaryYear >= 5 && anniversaryYear % 5 === 0;

        if (isMilestone) {
            let nextAnniversaryDate = new Date(startDate.setFullYear(today.getFullYear()));
            if (nextAnniversaryDate < today) {
                nextAnniversaryDate.setFullYear(today.getFullYear() + 1);
            }
            
            if (isWithinInterval(nextAnniversaryDate, interval)) {
                upcomingAnniversaries.push({
                    employee,
                    date: startDate,
                    type: 'anniversary',
                    celebrationText: `${anniversaryYear} Year${anniversaryYear > 1 ? 's' : ''}`
                });
            }
        }
    }
  });

  const sortFn = (a: Celebration, b: Celebration) => {
      let nextDateA = new Date(a.date.setFullYear(today.getFullYear()));
      if (nextDateA < today) nextDateA.setFullYear(today.getFullYear() + 1);

      let nextDateB = new Date(b.date.setFullYear(today.getFullYear()));
      if (nextDateB < today) nextDateB.setFullYear(today.getFullYear() + 1);

      return nextDateA.getTime() - nextDateB.getTime();
  }

  upcomingBirthdays.sort(sortFn);
  upcomingAnniversaries.sort(sortFn);

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
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
                {upcomingBirthdays.map(celebration => <CelebrationItem key={`${celebration.employee.id}-bday`} celebration={celebration} />)}
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
                <CardTitle>Milestone Anniversaries</CardTitle>
                <CardDescription>Celebrating in the next 30 days.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           {upcomingAnniversaries.length > 0 ? (
             <ul className="divide-y">
                {upcomingAnniversaries.map(celebration => <CelebrationItem key={`${celebration.employee.id}-anniversary`} celebration={celebration} />)}
             </ul>
            ) : (
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>No milestone anniversaries in the next 30 days.</p>
             </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
