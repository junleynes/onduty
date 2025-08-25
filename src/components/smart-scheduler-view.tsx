'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { runGenerateSchedule } from '@/app/actions';
import { Loader2, Wand2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const availabilityPlaceholder = `Employee ID, Day, Start Time, End Time
emp-001, Monday, 08:00, 16:00
emp-002, Monday, 09:00, 17:00
...`;

const demandPlaceholder = `Day, Hour, Required Staff
Monday, 09:00, 3
Monday, 10:00, 4
...`;

const rulesPlaceholder = `- Minimum shift length: 4 hours
- Maximum shift length: 8 hours
- At least one Manager must be on duty at all times
...`;

export default function SmartSchedulerView() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSchedule('');

    const formData = new FormData(event.currentTarget);
    const input = {
      employeeAvailability: formData.get('employeeAvailability') as string,
      demandForecasts: formData.get('demandForecasts') as string,
      organizationalRules: formData.get('organizationalRules') as string,
    };
    
    if (!input.employeeAvailability || !input.demandForecasts || !input.organizationalRules) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all fields to generate a schedule.",
        });
        return;
    }

    startTransition(async () => {
      const result = await runGenerateSchedule(input);
      if (result.success && result.data) {
        setSchedule(result.data.shiftSchedule);
        toast({
          title: "Schedule Generated!",
          description: "The AI-powered schedule has been successfully created.",
          action: <CheckCircle className="text-green-500" />
        });
      } else {
        setError(result.error || 'An unknown error occurred.');
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: result.error || "Could not generate schedule.",
        });
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Smart Scheduler</CardTitle>
            <CardDescription>
              Input your constraints and let our AI generate an optimized shift schedule for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeAvailability">Employee Availability</Label>
              <Textarea id="employeeAvailability" name="employeeAvailability" placeholder={availabilityPlaceholder} rows={5} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demandForecasts">Demand Forecasts</Label>
              <Textarea id="demandForecasts" name="demandForecasts" placeholder={demandPlaceholder} rows={5} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationalRules">Organizational Rules</Label>
              <Textarea id="organizationalRules" name="organizationalRules" placeholder={rulesPlaceholder} rows={5} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate Schedule
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Schedule</CardTitle>
          <CardDescription>Review the AI-generated schedule below.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {schedule && (
            <div className="p-4 bg-muted rounded-md max-h-[500px] overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">{schedule}</pre>
            </div>
          )}
          {!isPending && !error && !schedule && (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <p>The generated schedule will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
