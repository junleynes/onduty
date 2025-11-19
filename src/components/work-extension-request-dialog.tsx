
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
import type { Leave, Employee } from '@/types';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { format } from 'date-fns';
import { DatePicker } from './ui/date-picker';


const requestSchema = z.object({
  originalShiftDate: z.date({ required_error: "Original shift date is required."}),
  originalStartTime: z.string().min(1, 'Original shift start time is required.'),
  originalEndTime: z.string().min(1, 'Original shift end time is required.'),
  startDate: z.date({ required_error: "A start date is required."}),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  reason: z.string().min(1, 'Reason is required.'),
});


type WorkExtensionRequestDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  request: Partial<Leave> | null;
  onSave: (request: Partial<Leave>) => void;
  currentUser: Employee;
};

export function WorkExtensionRequestDialog({ isOpen, setIsOpen, request, onSave, currentUser }: WorkExtensionRequestDialogProps) {
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        originalShiftDate: request?.originalShiftDate ? new Date(request.originalShiftDate) : new Date(),
        originalStartTime: request?.originalStartTime || '',
        originalEndTime: request?.originalEndTime || '',
        startDate: request?.startDate ? new Date(request.startDate) : new Date(),
        startTime: request?.startTime || '',
        endTime: request?.endTime || '',
        reason: request?.reason || '',
      });
    }
  }, [request, isOpen, form]);

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    const finalValues: Partial<Leave> = {
      ...values,
      type: 'Work Extension',
      endDate: values.startDate, // Work extensions are for a single day
      isAllDay: false,
    };
    onSave(finalValues);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{request?.id ? 'Edit' : 'New'} Work Extension Request</DialogTitle>
          <DialogDescription>
            {request?.id ? 'Update the details for your work extension.' : 'Fill in the details for your work extension.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
             <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                <Input readOnly disabled value={`${currentUser.firstName} ${currentUser.lastName}`} />
                </FormControl>
            </FormItem>

             <div className="rounded-md border p-4 space-y-4">
                <p className="text-sm font-medium">Original Shift Details</p>
                 <FormField
                    control={form.control}
                    name="originalShiftDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Original Shift</FormLabel>
                            <DatePicker date={field.value} onDateChange={field.onChange} />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="originalStartTime"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <Input type="time" {...field} />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="originalEndTime"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <Input type="time" {...field} />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
             </div>
             
             <div className="rounded-md border p-4 space-y-4">
                <p className="text-sm font-medium">Extended Work Details</p>
                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Work Extension</FormLabel>
                            <DatePicker date={field.value} onDateChange={field.onChange} />
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
                            <Input type="time" {...field} />
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
                            <Input type="time" {...field} />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>

             </div>

             <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Extension</FormLabel>
                   <FormControl>
                    <Textarea {...field} placeholder="Please provide a brief reason for your request..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
