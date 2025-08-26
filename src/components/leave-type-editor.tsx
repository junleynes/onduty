
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Input } from './ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export type LeaveTypeOption = {
  type: string;
  color: string;
};

const leaveTypeSchema = z.object({
  type: z.string().min(1, 'Type name is required'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a valid hex color'),
});

const formSchema = z.object({
  leaveTypes: z.array(leaveTypeSchema),
});

type LeaveTypeEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  leaveTypes: LeaveTypeOption[];
  setLeaveTypes: React.Dispatch<React.SetStateAction<LeaveTypeOption[]>>;
};

export function LeaveTypeEditor({ isOpen, setIsOpen, leaveTypes, setLeaveTypes }: LeaveTypeEditorProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveTypes: leaveTypes,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'leaveTypes',
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ leaveTypes });
    }
  }, [isOpen, leaveTypes, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLeaveTypes(values.leaveTypes);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Leave Types</DialogTitle>
          <DialogDescription>
            Add, edit, or remove leave types and their associated colors.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-72 pr-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`leaveTypes.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`leaveTypes.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="color" {...field} className="p-1 h-10 w-10" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
             <Button
                type="button"
                variant="outline"
                onClick={() => append({ type: '', color: '#000000' })}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Leave Type
            </Button>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
