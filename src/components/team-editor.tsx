
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Employee } from '@/types';
import { employees as initialEmployees } from '@/lib/data';
import { DatePicker } from './ui/date-picker';

const employeeSchema = z.object({
  id: z.string().optional(),
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleInitial: z.string().max(1).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  birthDate: z.date({ required_error: 'Birth date is required.' }),
  startDate: z.date({ required_error: 'Start date is required.' }),
  position: z.enum(['Manager', 'Chef', 'Barista', 'Cashier']),
  department: z.string().min(1, 'Department is required'),
  section: z.string().min(1, 'Section is required'),
  avatar: z.string().optional(),
});

type TeamEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  employee: Partial<Employee> | null;
  onSave: (employee: Partial<Employee>) => void;
};

const positions: Employee['position'][] = ['Manager', 'Chef', 'Barista', 'Cashier'];
const departments = [...new Set(initialEmployees.map(e => e.department))];
const sections = [...new Set(initialEmployees.map(e => e.section))];

export function TeamEditor({ isOpen, setIsOpen, employee, onSave }: TeamEditorProps) {
  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      id: employee?.id || undefined,
      employeeNumber: employee?.employeeNumber || '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      middleInitial: employee?.middleInitial || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      birthDate: employee?.birthDate ? new Date(employee.birthDate) : undefined,
      startDate: employee?.startDate ? new Date(employee.startDate) : undefined,
      position: employee?.position || 'Barista',
      department: employee?.department || '',
      section: employee?.section || '',
      avatar: employee?.avatar || '',
    },
  });

  useEffect(() => {
    form.reset({
      id: employee?.id || undefined,
      employeeNumber: employee?.employeeNumber || '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      middleInitial: employee?.middleInitial || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      birthDate: employee?.birthDate ? new Date(employee.birthDate) : undefined,
      startDate: employee?.startDate ? new Date(employee.startDate) : undefined,
      position: employee?.position || 'Barista',
      department: employee?.department || '',
      section: employee?.section || '',
      avatar: employee?.avatar || '',
    });
  }, [employee, form, isOpen]);

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    onSave(values);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{employee?.id ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          <DialogDescription>
            {employee?.id ? "Update the details for this team member." : "Fill in the details for the new team member."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="middleInitial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M.I.</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., C" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., jane.doe@example.com" {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., (123) 456-7890" {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(dep => (
                            <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections.map(sec => (
                            <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Birth Date</FormLabel>
                    <DatePicker 
                        date={field.value} 
                        onDateChange={field.onChange}
                        dateProps={{
                           captionLayout: "dropdown-buttons",
                           fromYear: 1950,
                           toYear: new Date().getFullYear()
                        }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        dateProps={{
                            captionLayout: "dropdown-buttons",
                            fromYear: 2010,
                            toYear: new Date().getFullYear()
                        }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
