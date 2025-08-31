
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
import { DatePicker } from './ui/date-picker';
import type { Leave } from '@/types';
import { Textarea } from './ui/textarea';
import { initialLeaveTypes } from '@/lib/data';

const requestSchema = z.object({
  type: z.string().min(1, { message: 'Leave type is required.' }),
  date: z.date({ required_error: 'A date is required.' }),
  reason: z.string().min(1, 'Reason is required.'),
  isAllDay: z.boolean().default(true), // Assuming all requests are for a full day for simplicity
});

type LeaveRequestDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  request: Partial<Leave> | null;
  onSave: (request: Partial<Leave>) => void;
};

export function LeaveRequestDialog({ isOpen, setIsOpen, request, onSave }: LeaveRequestDialogProps) {
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: request?.type || 'VL',
      date: request?.date ? new Date(request.date) : new Date(),
      reason: request?.reason || '',
      isAllDay: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: request?.type || 'VL',
        date: request?.date ? new Date(request.date) : new Date(),
        reason: request?.reason || '',
        isAllDay: true,
      });
    }
  }, [request, isOpen, form]);

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    onSave(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{request?.id ? 'Edit Request' : 'New Time Off Request'}</DialogTitle>
          <DialogDescription>
            {request?.id ? 'Update the details for your request.' : 'Fill in the details for your request.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a request type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {initialLeaveTypes.map(lt => (
                        <SelectItem key={lt.type} value={lt.type}>{lt.type}</SelectItem>
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
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
