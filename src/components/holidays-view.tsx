
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartyPopper, PlusCircle } from 'lucide-react';
import type { Holiday } from '@/types';
import { format } from 'date-fns';

type HolidaysViewProps = {
  holidays: Holiday[];
  isManager: boolean;
  onManageHolidays: () => void;
};

export default function HolidaysView({ holidays, isManager, onManageHolidays }: HolidaysViewProps) {
  
  const sortedHolidays = [...holidays].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Company Holidays</CardTitle>
          <CardDescription>A list of all official company holidays for the year.</CardDescription>
        </div>
        {isManager && (
            <Button onClick={onManageHolidays}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Manage Holidays
            </Button>
        )}
      </CardHeader>
      <CardContent>
         {sortedHolidays.length > 0 ? (
             <ul className="divide-y rounded-md border">
                {sortedHolidays.map(holiday => (
                   <li key={holiday.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                             <PartyPopper className="h-5 w-5 text-primary" />
                             <div>
                                 <p className="font-semibold">{holiday.title}</p>
                                 <p className="text-sm text-muted-foreground">{format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}</p>
                             </div>
                        </div>
                   </li>
                ))}
             </ul>
            ) : (
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>No holidays have been added yet.</p>
                {isManager && <p className="text-sm mt-1">Click "Manage Holidays" to add some.</p>}
             </div>
            )}
      </CardContent>
    </Card>
  );
}
