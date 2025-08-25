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

const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required.' }),
  role: z.enum(['Manager', 'Chef', 'Barista', 'Cashier']),
  avatar: z.string().optional(),
});

type TeamEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  employee: Partial<Employee> | null;
  onSave: (employee: Partial<Employee>) => void;
};

const roles: Employee['role'][] = ['Manager', 'Chef', 'Barista', 'Cashier'];

export function TeamEditor({ isOpen, setIsOpen, employee, onSave }: TeamEditorProps) {
  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      id: employee?.id || undefined,
      name: employee?.name || '',
      role: employee?.role || 'Barista',
      avatar: employee?.avatar || '',
    },
  });

  useEffect(() => {
    form.reset({
      id: employee?.id || undefined,
      name: employee?.name || '',
      role: employee?.role || 'Barista',
      avatar: employee?.avatar || '',
    });
  }, [employee, form, isOpen]);

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    onSave(values);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{employee?.id ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          <DialogDescription>
            {employee?.id ? "Update the details for this team member." : "Fill in the details for the new team member."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
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
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
