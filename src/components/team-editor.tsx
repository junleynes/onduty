
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
import { Input } from '@/components/ui/input';
import type { Employee } from '@/types';
import { employees as initialEmployees } from '@/lib/data';
import { DatePicker } from './ui/date-picker';

const employeeSchema = z.object({
  id: z.string().optional(),
  employeeNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleInitial: z.string().max(1).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.date().optional().nullable(),
  startDate: z.date().optional().nullable(),
  position: z.string().optional(),
  department: z.string().optional(),
  section: z.string().optional(),
  avatar: z.string().optional(),
});


type TeamEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  employee: Partial<Employee> | null;
  onSave: (employee: Partial<Employee>) => void;
};

export function TeamEditor({ isOpen, setIsOpen, employee, onSave }: TeamEditorProps) {
    const [positions, setPositions] = useState(() => [...new Set(initialEmployees.map(e => e.position))]);
    const [departments, setDepartments] = useState(() => [...new Set(initialEmployees.map(e => e.department))]);
    const [sections, setSections] = useState(() => [...new Set(initialEmployees.map(e => e.section))]);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee?.id ? {
      ...employee,
      birthDate: employee.birthDate ? new Date(employee.birthDate) : undefined,
      startDate: employee.startDate ? new Date(employee.startDate) : undefined,
    } : {
      id: undefined,
      employeeNumber: '',
      firstName: '',
      lastName: '',
      middleInitial: '',
      email: '',
      phone: '',
      birthDate: undefined,
      startDate: undefined,
      position: '',
      department: '',
      section: '',
      avatar: '',
    }
  });

  useEffect(() => {
    if(isOpen) {
        form.reset(employee?.id ? {
            ...employee,
            birthDate: employee.birthDate ? new Date(employee.birthDate) : undefined,
            startDate: employee.startDate ? new Date(employee.startDate) : undefined,
        } : {
            id: undefined,
            employeeNumber: '',
            firstName: '',
            lastName: '',
            middleInitial: '',
            email: '',
            phone: '',
            birthDate: undefined,
            startDate: undefined,
            position: '',
            department: '',
            section: '',
            avatar: '',
        });
    }
  }, [employee, form, isOpen]);

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    onSave(values);
    
    // Add new values to lists if they don't exist
    if (values.position && !positions.includes(values.position)) setPositions(prev => [...prev, values.position!]);
    if (values.department && !departments.includes(values.department)) setDepartments(prev => [...prev, values.department!]);
    if (values.section && !sections.includes(values.section)) setSections(prev => [...prev, values.section!]);

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
                      <Input {...field} />
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
                    <FormControl>
                        <Input list="positions-list" {...field} />
                    </FormControl>
                    <datalist id="positions-list">
                        {positions.map(pos => <option key={pos} value={pos} />)}
                    </datalist>
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} type="email" />
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
                      <Input {...field} type="tel" />
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
                      <FormControl>
                        <Input list="departments-list" {...field} />
                      </FormControl>
                      <datalist id="departments-list">
                          {departments.map(dep => <option key={dep} value={dep} />)}
                      </datalist>
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
                       <FormControl>
                        <Input list="sections-list" {...field} />
                       </FormControl>
                       <datalist id="sections-list">
                          {sections.map(sec => <option key={sec} value={sec} />)}
                       </datalist>
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
                        date={field.value || undefined} 
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
                        date={field.value || undefined}
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
