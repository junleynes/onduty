

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
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import type { LeaveTypeOption } from './leave-type-editor';

const requestSchema = z.object({
  type: z.string().min(1, { message: 'Leave type is required.' }),
  reason: z.string().min(1, 'Reason is required.'),
  // Extended Work Period
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  // Original Shift (for work extension)
  originalShiftDate: z.date().optional(),
  originalStartTime: z.string().optional(),
  originalEndTime: z.string().optional(),
}).refine(data => {
    if (data.type !== 'Work Extension') return true;
    return data.originalShiftDate && data.originalStartTime && data.originalEndTime && data.startTime && data.endTime;
}, {
    message: "All date and time fields are required for Work Extensions.",
    path: ['originalShiftDate'], 
});


type LeaveRequestDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  request: Partial<Leave> | null;
  onSave: (request: Partial<Leave>) => void;
  leaveTypes: LeaveTypeOption[];
};

export function LeaveRequestDialog({ isOpen, setIsOpen, request, onSave, leaveTypes }: LeaveRequestDialogProps) {
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: request?.type || 'VL',
        reason: request?.reason || '',
        // Extended
        date: request?.date ? new Date(request.date) : new Date(),
        startTime: request?.startTime || '',
        endTime: request?.endTime || '',
        // Original
        originalShiftDate: request?.originalShiftDate ? new Date(request.originalShiftDate) : undefined,
        originalStartTime: request?.originalStartTime || '',
        originalEndTime: request?.originalEndTime || '',
      });
    }
  }, [request, isOpen, form]);

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    const finalValues: Partial<Leave> = {
        ...values,
        isAllDay: values.type !== 'Work Extension'
    }
    onSave(finalValues);
  };
  
  const selectedType = form.watch('type');

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                      {leaveTypes.map(lt => (
                        <SelectItem key={lt.type} value={lt.type}>{lt.type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === 'Work Extension' ? (
                <>
                    <Separator />
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm">Original Shift Details</h4>
                        <FormField
                            control={form.control}
                            name="originalShiftDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Original Shift Date</FormLabel>
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
                                        <FormLabel>Original Start Time</FormLabel>
                                        <FormControl><Input type="time" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="originalEndTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Original End Time</FormLabel>
                                        <FormControl><Input type="time" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <Separator />
                     <div className="space-y-4">
                        <h4 className="font-medium text-sm">Extended Work Period</h4>
                         <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Date of Work Extended</FormLabel>
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
                                        <FormLabel>Extended Start Time</FormLabel>
                                        <FormControl><Input type="time" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Extended End Time</FormLabel>
                                        <FormControl><Input type="time" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </>
            ) : (
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
            )}
           
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
