
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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Employee, Shift } from '@/types';
import { Checkbox } from './ui/checkbox';

const shiftSchema = z.object({
  employeeId: z.string().nullable(),
  label: z.string().optional(),
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  color: z.string().optional(),
  id: z.string().optional(),
  isDayOff: z.boolean().default(false),
}).refine(data => {
    if (data.isDayOff) return true;
    return !!data.label && !!data.startTime && !!data.endTime;
}, {
    message: "Label, start time, and end time are required for shifts.",
    path: ["label"],
});


type ShiftEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shift: Shift | Partial<Shift> | null;
  onSave: (shift: Shift | Partial<Shift>) => void;
  employees: Employee[];
};

const roleColors: { [key: string]: string } = {
  Manager: 'hsl(var(--chart-2))',
  Chef: 'hsl(var(--chart-1))',
  Barista: 'hsl(var(--chart-5))',
  Cashier: 'hsl(var(--chart-3))',
};

const shiftColorOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Orange', value: 'hsl(var(--chart-4))' },
    { label: 'Red', value: 'hsl(var(--chart-1))' },
    { label: 'Blue', value: '#3498db' },
    { label: 'Green', value: 'hsl(var(--chart-2))' },
    { label: 'Purple', value: '#9b59b6' },
];

export function ShiftEditor({ isOpen, setIsOpen, shift, onSave, employees }: ShiftEditorProps) {
    const selectedEmployee = employees.find(e => e.id === shift?.employeeId);
    const defaultColor = selectedEmployee ? roleColors[selectedEmployee.role] : '';

  const form = useForm<z.infer<typeof shiftSchema>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      id: shift?.id || undefined,
      employeeId: shift?.employeeId || null,
      label: shift?.label || '',
      date: shift?.date || new Date(),
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      color: shift?.color || defaultColor,
      isDayOff: shift?.isDayOff || false,
    },
  });

  useEffect(() => {
    const selectedEmployee = employees.find(e => e.id === shift?.employeeId);
    const defaultColor = selectedEmployee ? roleColors[selectedEmployee.role] : shiftColorOptions[1].value;
    form.reset({
      id: shift?.id || undefined,
      employeeId: shift?.employeeId || null,
      label: shift?.label || '',
      date: shift?.date || new Date(),
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      color: shift?.color || defaultColor,
      isDayOff: shift?.isDayOff || false,
    });
  }, [shift, form, employees]);

  const onSubmit = (values: z.infer<typeof shiftSchema>) => {
    const finalValues = { ...values };
    if (values.isDayOff) {
        finalValues.label = 'Day Off';
        finalValues.startTime = '';
        finalValues.endTime = '';
        finalValues.color = 'transparent';
    } else if (finalValues.color === 'default' || !finalValues.color) {
        const employee = employees.find(e => e.id === values.employeeId);
        finalValues.color = employee ? roleColors[employee.role] : shiftColorOptions[1].value;
    }
    onSave(finalValues);
  };
  
  const isDayOff = form.watch('isDayOff');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{shift?.id ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
          <DialogDescription>
            {shift?.id ? "Update the details for this shift." : "Fill in the details for the new shift."}
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
                  <Select onValueChange={(value) => field.onChange(value === 'unassigned' ? null : value)} defaultValue={field.value || 'unassigned'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={'unassigned'}>Unassigned</SelectItem>
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
              name="isDayOff"
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
                        Day Off
                        </FormLabel>
                    </div>
                </FormItem>
              )}
            />

            {!isDayOff && (
              <>
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Morning Shift" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shiftColorOptions.map(option => (
                            <SelectItem key={option.label} value={option.value}>
                               <div className="flex items-center gap-2">
                                    {option.value && option.value !== 'default' && <div className="w-4 h-4 rounded-full" style={{backgroundColor: option.value}} />}
                                    <span>{option.label}</span>
                               </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Save Shift</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
