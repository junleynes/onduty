
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Employee, Leave, LeaveType } from '@/types';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';

const leaveSchema = z.object({
  employeeId: z.string().min(1, { message: 'Employee is required.' }),
  type: z.enum(['Vacation', 'Emergency', 'Unavailable', 'Time Off Request', 'Day Off']),
  date: z.date({ required_error: 'A date is required.' }),
  isAllDay: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  id: z.string().optional(),
}).refine(data => data.isAllDay || (data.startTime && data.endTime), {
    message: "Start and end times are required for partial day leave.",
    path: ["startTime"],
});

type LeaveEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  leave: Partial<Leave> | null;
  onSave: (leave: Leave | Partial<Leave>) => void;
  employees: Employee[];
};

const leaveTypes: LeaveType[] = ['Day Off', 'Time Off Request', 'Unavailable', 'Vacation', 'Emergency'];

export function LeaveEditor({ isOpen, setIsOpen, leave, onSave, employees }: LeaveEditorProps) {
  const form = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      id: leave?.id || undefined,
      employeeId: leave?.employeeId || '',
      type: leave?.type || 'Day Off',
      date: leave?.date || new Date(),
      isAllDay: leave?.isAllDay ?? true,
      startTime: leave?.startTime || '',
      endTime: leave?.endTime || '',
    },
  });

  useEffect(() => {
    form.reset({
      id: leave?.id || undefined,
      employeeId: leave?.employeeId || '',
      type: leave?.type || 'Day Off',
      date: leave?.date || new Date(),
      isAllDay: leave?.isAllDay ?? true,
      startTime: leave?.startTime || '',
      endTime: leave?.endTime || '',
    });
  }, [leave, form]);

  const onSubmit = (values: z.infer<typeof leaveSchema>) => {
    onSave(values);
  };

  const isAllDay = form.watch('isAllDay');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{leave?.id ? 'Edit Leave' : 'Add Leave'}</DialogTitle>
          <DialogDescription>
            {leave?.id ? "Update the details for this leave entry." : "Fill in the details for the new leave entry."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isAllDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                     <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        All day
                        </FormLabel>
                    </div>
                </FormItem>
              )}
            />

            {!isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
