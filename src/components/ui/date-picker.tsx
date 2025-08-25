
'use client';

import React from 'react';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from './input';

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  dateProps?: Omit<CalendarProps, 'mode' | 'selected' | 'onSelect'>;
}

export function DatePicker({ date, onDateChange, dateProps }: DatePickerProps) {
  const [dateString, setDateString] = React.useState(date ? format(date, 'MM/dd/yyyy') : '');

  React.useEffect(() => {
    setDateString(date ? format(date, 'MM/dd/yyyy') : '');
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setDateString(str);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const parsedDate = parse(str, 'MM/dd/yyyy', new Date());
      if (!isNaN(parsedDate.getTime())) {
        onDateChange(parsedDate);
      }
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    if (selectedDate) {
        setDateString(format(selectedDate, 'MM/dd/yyyy'));
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            type="text"
            placeholder="MM/dd/yyyy"
            value={dateString}
            onChange={handleInputChange}
            className="pr-10"
          />
          <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          {...dateProps}
        />
      </PopoverContent>
    </Popover>
  );
}
