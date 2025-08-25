'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { weekDays } from '@/lib/data';
import { CheckCircle } from 'lucide-react';

const timeOptions = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const availabilitySchema = z.object({
  ...Object.fromEntries(
    weekDays.map(day => [
      day,
      z.object({
        available: z.boolean().default(false),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      }),
    ])
  ),
});

export default function AvailabilityView() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: Object.fromEntries(weekDays.map(day => [day, { available: false, startTime: '09:00', endTime: '17:00' }])),
  });

  function onSubmit(values: z.infer<typeof availabilitySchema>) {
    console.log(values);
    toast({
      title: 'Availability Submitted',
      description: 'Your manager has been notified of your updated availability.',
      action: <CheckCircle className="text-green-500" />,
    });
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Your Availability</CardTitle>
        <CardDescription>Let your manager know when you're available to work next week.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {weekDays.map(day => (
              <FormField
                key={day}
                control={form.control}
                name={`${day}.available`}
                render={({ field }) => (
                  <FormItem className="rounded-lg border p-4 transition-colors data-[state=checked]:bg-primary/5">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                      <div className="flex items-center space-x-3 mb-2 md:mb-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} id={day}/>
                        </FormControl>
                        <FormLabel htmlFor={day} className="text-lg font-semibold w-20">{day}</FormLabel>
                      </div>
                      <div className={`grid grid-cols-2 gap-4 flex-1 transition-opacity ${field.value ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <FormField
                          control={form.control}
                          name={`${day}.startTime`}
                          render={({ field: timeField }) => (
                            <FormItem>
                              <FormLabel>From</FormLabel>
                              <Select onValueChange={timeField.onChange} defaultValue={timeField.value} disabled={!field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Start time" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeOptions.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`${day}.endTime`}
                          render={({ field: timeField }) => (
                            <FormItem>
                              <FormLabel>To</FormLabel>
                              <Select onValueChange={timeField.onChange} defaultValue={timeField.value} disabled={!field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="End time" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeOptions.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Availability'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
