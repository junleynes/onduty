
'use client';

import React, { useState, useEffect } from 'react';
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
  const [dateString, setDateString] = useState<string>(date ? format(date, 'MM/dd/yyyy') : '');

  useEffect(() => {
    if (date) {
      setDateString(format(date, 'MM/dd/yyyy'));
    } else {
        setDateString('');
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateString(value);

    if (value.length === 10) { // Basic check for MM/dd/yyyy length
      try {
        const parsedDate = parse(value, 'MM/dd/yyyy', new Date());
        if (!isNaN(parsedDate.getTime())) {
          onDateChange(parsedDate);
        } else {
            onDateChange(undefined);
        }
      } catch {
        onDateChange(undefined);
      }
    } else {
        onDateChange(undefined);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
  };

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
      <PopoverContent className="w-auto p-0" align="start">
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
