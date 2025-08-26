
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn, getFullName } from '@/lib/utils';
import type { LeaveTypeOption } from './leave-type-editor';

const leaveSchema = z.object({
  employeeId: z.string().min(1, { message: 'Employee is required.' }),
  type: z.string().min(1, { message: 'Leave type is required.' }),
  color: z.string().optional(),
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
  onDelete: (leaveId: string) => void;
  employees: Employee[];
  leaveTypes: LeaveTypeOption[];
};


export function LeaveEditor({ isOpen, setIsOpen, leave, onSave, onDelete, employees, leaveTypes }: LeaveEditorProps) {

  const form = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      id: leave?.id || undefined,
      employeeId: leave?.employeeId || '',
      type: leave?.type || 'OFFSET',
      color: leave?.color || '#6b7280',
      date: leave?.date || new Date(),
      isAllDay: leave?.isAllDay ?? true,
      startTime: leave?.startTime || '',
      endTime: leave?.endTime || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        const selectedType = leaveTypes.find(lt => lt.type === (leave?.type || 'OFFSET'));
        form.reset({
            id: leave?.id || undefined,
            employeeId: leave?.employeeId || '',
            type: leave?.type || 'OFFSET',
            color: leave?.color || selectedType?.color || '#6b7280',
            date: leave?.date ? new Date(leave.date) : new Date(),
            isAllDay: leave?.isAllDay ?? true,
            startTime: leave?.startTime || '',
            endTime: leave?.endTime || '',
        });
    }
  }, [leave, form, leaveTypes, isOpen]);

  const onSubmit = (values: z.infer<typeof leaveSchema>) => {
    onSave(values);
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                   <DatePicker
                        date={field.value}
                        onDateChange={(date) => field.onChange(date)}
                    />
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
