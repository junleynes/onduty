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
import type { Employee, Shift } from '@/types';

const shiftSchema = z.object({
  employeeId: z.string().min(1, { message: 'Employee is required.' }),
  day: z.string().min(1, { message: 'Day is required.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:MM).' }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:MM).' }),
  color: z.string().optional(),
  id: z.string().optional(),
});

type ShiftEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shift: Shift | Partial<Shift> | null;
  onSave: (shift: Shift) => void;
  employees: Employee[];
  weekDays: Shift['day'][];
};

const roleColors: { [key: string]: string } = {
  Manager: 'hsl(var(--accent))',
  Chef: 'hsl(var(--chart-1))',
  Barista: 'hsl(var(--chart-2))',
  Cashier: 'hsl(var(--chart-3))',
};

const shiftColorOptions = [
    { label: 'Default', value: '' },
    { label: 'Blue', value: '#3498db' },
    { label: 'Green', value: '#2ecc71' },
    { label: 'Purple', value: '#9b59b6' },
    { label: 'Orange', value: '#e67e22' },
    { label: 'Red', value: '#e74c3c' },
];

export function ShiftEditor({ isOpen, setIsOpen, shift, onSave, employees, weekDays }: ShiftEditorProps) {
    const selectedEmployee = employees.find(e => e.id === shift?.employeeId);
    const defaultColor = selectedEmployee ? roleColors[selectedEmployee.role] : '';

  const form = useForm<z.infer<typeof shiftSchema>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      id: shift?.id || undefined,
      employeeId: shift?.employeeId || '',
      day: shift?.day || '',
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      color: shift?.color || defaultColor,
    },
  });

  useEffect(() => {
    const selectedEmployee = employees.find(e => e.id === shift?.employeeId);
    const defaultColor = selectedEmployee ? roleColors[selectedEmployee.role] : '';
    form.reset({
      id: shift?.id || undefined,
      employeeId: shift?.employeeId || '',
      day: shift?.day || '',
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      color: shift?.color || defaultColor,
    });
  }, [shift, form, employees]);

  const onSubmit = (values: z.infer<typeof shiftSchema>) => {
    const finalValues = { ...values };
    if (!finalValues.color) {
        const employee = employees.find(e => e.id === values.employeeId);
        finalValues.color = employee ? roleColors[employee.role] : undefined;
    }
    onSave(finalValues as Shift);
  };

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
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {weekDays.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <div className="flex items-center gap-2">
                           {field.value && <div className="w-4 h-4 rounded-full" style={{backgroundColor: field.value}} />}
                           <SelectValue placeholder="Select a color" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shiftColorOptions.map(option => (
                        <SelectItem key={option.label} value={option.value || ''}>
                           <div className="flex items-center gap-2">
                                {option.value && <div className="w-4 h-4 rounded-full" style={{backgroundColor: option.value}} />}
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
