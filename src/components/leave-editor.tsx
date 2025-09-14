
'use client';

import React, { useEffect, useState } from 'react';
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
import { Trash2 } from 'lucide-react';
import type { Employee, Leave, LeaveType } from '@/types';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { DatePicker } from './ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown, CalendarIcon } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn, getFullName } from '@/lib/utils';
import type { LeaveTypeOption } from './leave-type-editor';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';

const leaveSchema = z.object({
  employeeId: z.string().min(1, { message: 'Employee is required.' }),
  type: z.string().min(1, { message: 'Leave type is required.' }),
  color: z.string().optional(),
  dateRange: z.object({
      from: z.date({ required_error: "A start date is required."}),
      to: z.date().optional(),
  }),
  isAllDay: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  id: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
}).refine(data => data.isAllDay || (data.startTime && data.endTime), {
    message: "Start and end times are required for partial day leave.",
    path: ["startTime"],
});

type LeaveEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  leave: Partial<Leave> | null;
  onSave: (leave: Leave | Partial<Leave>) => void;
  onDelete: (leaveId: string) => void;
  employees: Employee[];
  leaveTypes: LeaveTypeOption[];
};


export function LeaveEditor({ isOpen, setIsOpen, leave, onSave, onDelete, employees, leaveTypes }: LeaveEditorProps) {

  const form = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (isOpen) {
        const fromDate = leave?.startDate ? new Date(leave.startDate) : new Date();
        const toDate = leave?.endDate ? new Date(leave.endDate) : fromDate;
        const defaultType = leave?.type || (leaveTypes.length > 0 ? leaveTypes[0].type : '');
        const selectedType = leaveTypes.find(lt => lt.type === defaultType);
        form.reset({
            id: leave?.id || undefined,
            employeeId: leave?.employeeId || '',
            type: defaultType,
            color: leave?.color || selectedType?.color || '#3b82f6',
            dateRange: { from: fromDate, to: toDate },
            isAllDay: leave?.isAllDay ?? true,
            startTime: leave?.startTime || '',
            endTime: leave?.endTime || '',
            status: leave?.status || 'approved', // Manually added leave is auto-approved
        });
    }
  }, [leave, form, leaveTypes, isOpen]);

  const onSubmit = (values: z.infer<typeof leaveSchema>) => {
    const selectedType = leaveTypes.find(lt => lt.type === values.type);
    onSave({ 
      ...values, 
      color: selectedType?.color,
      startDate: values.dateRange.from,
      endDate: values.dateRange.to || values.dateRange.from,
    });
  };
  
  const handleDelete = () => {
    if (leave?.id) {
        onDelete(leave.id);
    }
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
                        <SelectItem key={emp.id} value={emp.id}>{getFullName(emp)}</SelectItem>
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
                 <FormItem className="flex flex-col">
                    <FormLabel>Leave Type</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                >
                                {field.value
                                    ? leaveTypes.find((lt) => lt.type.toLowerCase() === field.value.toLowerCase())?.type
                                    : "Select leave type"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[375px] p-0">
                            <Command>
                                <CommandInput 
                                    placeholder="Search leave type..."
                                />
                                <CommandList>
                                    <CommandEmpty>No leave type found.</CommandEmpty>
                                    <CommandGroup>
                                        {leaveTypes.map((lt) => (
                                        <CommandItem
                                            value={lt.type}
                                            key={lt.type}
                                            onSelect={() => {
                                                form.setValue("type", lt.type);
                                                form.setValue("color", lt.color);
                                            }}
                                        >
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === lt.type ? "opacity-100" : "opacity-0"
                                            )}
                                            />
                                            {lt.type}
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                 </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Leave Dates</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value.from && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.from ? (
                                        field.value.to ? (
                                            <>
                                                {format(field.value.from, "LLL dd, y")} -{" "}
                                                {format(field.value.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(field.value.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={field.value?.from}
                                selected={field.value}
                                onSelect={field.onChange}
                                numberOfMonths={2}
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
            
            <DialogFooter className="sm:justify-between">
              {leave?.id ? (
                <Button type="button" variant="destructive" onClick={handleDelete} className="sm:mr-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
              ) : <div></div>}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
