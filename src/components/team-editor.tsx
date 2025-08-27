
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
import type { Employee, UserRole } from '@/types';
import { employees as initialEmployees } from '@/lib/data';
import { DatePicker } from './ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const employeeSchema = z.object({
  id: z.string().optional(),
  employeeNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleInitial: z.string().max(1).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional().or(z.literal('')),
  birthDate: z.date().optional().nullable(),
  startDate: z.date().optional().nullable(),
  position: z.string().optional(),
  role: z.custom<UserRole>().optional(),
  group: z.string().optional(),
  avatar: z.string().optional(),
});


type TeamEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  employee: Partial<Employee> | null;
  onSave: (employee: Partial<Employee>) => void;
  isPasswordResetMode?: boolean;
  context?: 'admin' | 'manager';
  groups: string[];
  setGroups: React.Dispatch<React.SetStateAction<string[]>>;
};

export function TeamEditor({ isOpen, setIsOpen, employee, onSave, isPasswordResetMode = false, context = 'manager', groups, setGroups }: TeamEditorProps) {
    const [positions, setPositions] = useState(() => [...new Set(initialEmployees.map(e => e.position))]);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee?.id ? {
      ...employee,
      password: '', // Don't pre-fill password for existing users
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
      password: '',
      birthDate: undefined,
      startDate: undefined,
      position: '',
      role: 'member',
      group: '',
      avatar: '',
    }
  });

  useEffect(() => {
    if(isOpen) {
        form.reset(employee?.id ? {
            ...employee,
            password: '',
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
            password: '',
            birthDate: undefined,
            startDate: undefined,
            position: '',
            role: 'member',
            group: '',
            avatar: '',
        });
    }
  }, [employee, form, isOpen]);

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    if (isPasswordResetMode) {
        if (!values.password) {
            form.setError('password', { type: 'manual', message: 'A new password is required.' });
            return;
        }
    } else {
        if (!values.id && !values.password) {
            form.setError('password', { type: 'manual', message: 'Password is required for new members.' });
            return;
        }
    }
    
    const dataToSave = {...values};
    // Don't overwrite with empty password if user is just editing other details
    if (values.id && !values.password) {
      delete (dataToSave as any).password;
    }

    onSave(dataToSave);
    
    // Add new values to lists if they don't exist
    if (values.position && !positions.includes(values.position)) setPositions(prev => [...prev, values.position!]);
    if (values.group && !groups.includes(values.group)) setGroups(prev => [...prev, values.group!]);

    setIsOpen(false);
  };

  const isSimplifiedView = context === 'admin' && !isPasswordResetMode;

  const title = isPasswordResetMode ? 'Reset Your Password' : (isSimplifiedView ? 'Edit User' : (employee?.id ? 'Edit Team Member' : 'Add Team Member'));
  const description = isPasswordResetMode ? 'Enter a new password for your account.' : (isSimplifiedView ? "Update the user's core credentials and role." : (employee?.id ? "Update the details for this team member." : "Fill in the details for the new team member."));


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            {isPasswordResetMode ? (
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                        <Input type="password" {...field} placeholder='Enter new password' />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
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
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" {...field} placeholder={employee?.id ? 'Leave blank to keep current password' : ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="group"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Group</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a group" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {groups.map(group => (
                                        <SelectItem key={group} value={group}>{group}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    {!isSimplifiedView && (
                        <>
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
                        </>
                    )}
                </>
            )}

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
