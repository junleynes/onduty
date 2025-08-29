
'use client';

import React from 'react';
import type { Task, Shift, Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';

type MyTasksViewProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  shifts: Shift[];
  currentUser: Employee | null;
};

export default function MyTasksView({ tasks, setTasks, shifts, currentUser }: MyTasksViewProps) {
  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading user data...</p>
        </CardContent>
      </Card>
    );
  }

  const myShiftIds = new Set(shifts.filter(s => s.employeeId === currentUser.id).map(s => s.id));
  const myTasks = tasks.filter(task => myShiftIds.has(task.shiftId));

  const pendingTasks = myTasks.filter(task => task.status === 'pending');
  const completedTasks = myTasks.filter(task => task.status === 'completed');

  const handleTaskToggle = (taskId: string, isChecked: boolean) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: isChecked ? 'completed' : 'pending', completedAt: isChecked ? new Date() : undefined }
        : task
    ));
  };
  
  const getShiftForTask = (taskId: string): Shift | undefined => {
      const task = tasks.find(t => t.id === taskId);
      return shifts.find(s => s.id === task?.shiftId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>A list of tasks assigned to your shifts. Check them off as you complete them.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['pending', 'completed']} className="w-full space-y-4">
          <Card>
            <AccordionItem value="pending">
                <AccordionTrigger className="p-4">
                    <h3 className="text-lg font-semibold">Pending Tasks ({pendingTasks.length})</h3>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    {pendingTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {pendingTasks.map(task => {
                            const shift = getShiftForTask(task.id);
                            return (
                                <li key={task.id} className="flex items-start gap-3 rounded-md border p-4">
                                    <Checkbox
                                        id={`task-${task.id}`}
                                        className="mt-1"
                                        checked={task.status === 'completed'}
                                        onCheckedChange={(isChecked) => handleTaskToggle(task.id, !!isChecked)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor={`task-${task.id}`} className="font-medium cursor-pointer">
                                            {task.title}
                                        </label>
                                        <p className="text-muted-foreground text-sm">{task.description}</p>
                                        {shift && (
                                            <p className="text-muted-foreground text-xs">
                                                For shift on {format(new Date(shift.date), 'MMM d, yyyy')} ({shift.startTime} - {shift.endTime})
                                            </p>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            <ClipboardCheck className="mx-auto h-12 w-12" />
                            <p className="mt-4">You've completed all your tasks. Great job!</p>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
          </Card>

          <Card>
            <AccordionItem value="completed">
                <AccordionTrigger className="p-4">
                    <h3 className="text-lg font-semibold">Completed Tasks ({completedTasks.length})</h3>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    {completedTasks.length > 0 ? (
                        <ul className="space-y-3">
                        {completedTasks.map(task => (
                            <li key={task.id} className="flex items-start gap-3 rounded-md border p-4 opacity-70">
                                <Checkbox
                                    id={`task-${task.id}`}
                                    className="mt-1"
                                    checked={task.status === 'completed'}
                                    onCheckedChange={(isChecked) => handleTaskToggle(task.id, !!isChecked)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor={`task-${task.id}`} className="font-medium line-through cursor-pointer">
                                        {task.title}
                                    </label>
                                    <p className="text-muted-foreground text-sm line-through">{task.description}</p>
                                     {task.completedAt && (
                                        <p className="text-muted-foreground text-xs">
                                            Completed on {format(new Date(task.completedAt), 'MMM d, yyyy @ p')}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                        </ul>
                    ) : (
                         <div className="text-center text-muted-foreground p-8">
                            <p>No tasks completed yet. Get to work!</p>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
          </Card>
        </Accordion>
      </CardContent>
    </Card>
  );
}
