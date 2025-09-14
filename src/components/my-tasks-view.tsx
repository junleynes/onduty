

'use client';

import React from 'react';
import type { Task, Shift, Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import { ClipboardCheck, CalendarClock, CalendarX, CalendarCheck, Globe, Check, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

type MyTasksViewProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  shifts: Shift[];
  currentUser: Employee | null;
};

const TaskItem = ({ task, shift, onAcknowledge, onComplete }: { task: Task; shift?: Shift; onAcknowledge: (id: string) => void; onComplete: (id: string) => void; }) => {
    const isCompleted = task.status === 'completed';
    const isAcknowledged = task.status === 'acknowledged';

    return (
        <li className={cn("flex items-start gap-4 rounded-md border p-4", isCompleted && 'opacity-60 bg-muted/50')}>
            <div className="grid gap-1.5 leading-none flex-1">
                <label htmlFor={`task-${task.id}`} className={cn("font-medium", isCompleted && 'line-through')}>
                    {task.title}
                </label>
                <p className={cn("text-muted-foreground text-sm", isCompleted && 'line-through')}>{task.description}</p>
                
                 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
                    {task.scope === 'global' && <Badge variant="secondary"><Globe className="h-3 w-3 mr-1"/>Global</Badge>}
                    {shift && (
                        <Badge variant="outline">
                            For shift on {format(new Date(shift.date), 'MMM d, yyyy')} ({shift.startTime} - {shift.endTime})
                        </Badge>
                    )}
                 </div>

                 <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    {task.acknowledgedAt && (
                        <span className="flex items-center gap-1">
                            <CornerDownRight className="h-3 w-3" />
                            Acknowledged: {format(new Date(task.acknowledgedAt), 'MMM d @ p')}
                        </span>
                    )}
                    {task.completedAt && (
                        <span className="flex items-center gap-1 font-semibold text-green-600">
                             <Check className="h-3 w-3" />
                            Completed: {format(new Date(task.completedAt), 'MMM d @ p')}
                        </span>
                    )}
                 </div>
            </div>
            <div className="flex flex-col items-center gap-2 w-32">
                {task.status === 'pending' && (
                    <Button size="sm" className="w-full" onClick={() => onAcknowledge(task.id)}>Acknowledge</Button>
                )}
                {task.status === 'acknowledged' && (
                    <Button size="sm" className="w-full" onClick={() => onComplete(task.id)}>Mark as Complete</Button>
                )}
                {task.status === 'completed' && (
                    <div className="flex items-center justify-center text-green-600 font-semibold text-sm gap-1 h-9 px-3">
                       <Check className="h-4 w-4" />
                       Done
                    </div>
                )}
            </div>
        </li>
    );
}

const TaskSection = ({ title, icon: Icon, tasks, shifts, onAcknowledge, onComplete, emptyMessage, emptyIcon: EmptyIcon }: { 
    title: string;
    icon: React.ElementType;
    tasks: Task[];
    shifts: Shift[];
    onAcknowledge: (id: string) => void;
    onComplete: (id: string) => void;
    emptyMessage: string;
    emptyIcon: React.ElementType;
}) => {
     const getShiftForTask = (taskId: string): Shift | undefined => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.shiftId) return undefined;
        return shifts.find(s => s.id === task.shiftId);
    }
    
    return (
        <Card>
            <AccordionItem value={title.toLowerCase().replace(/[^a-z0-9]/g, '-')}>
                 <AccordionTrigger className="p-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {title} ({tasks.length})
                    </h3>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    {tasks.length > 0 ? (
                        <ul className="space-y-3">
                            {tasks.map(task => (
                                <TaskItem 
                                  key={task.id} 
                                  task={task} 
                                  shift={getShiftForTask(task.id)} 
                                  onAcknowledge={onAcknowledge}
                                  onComplete={onComplete}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <EmptyIcon className="mx-auto h-12 w-12" />
                            <p className="mt-4">{emptyMessage}</p>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Card>
    )
}

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
  
  const myTasks = tasks.filter(task => {
    if (task.scope === 'global') return true;
    if (task.scope === 'shift' && task.shiftId && myShiftIds.has(task.shiftId)) return true;
    if (task.scope === 'personal' && task.assigneeId === currentUser.id) return true;
    return false;
  });

  const shiftsById = new Map(shifts.map(s => [s.id, s]));
  const today = startOfDay(new Date());

  const pendingTasks = myTasks.filter(task => task.status === 'pending');
  const acknowledgedTasks = myTasks.filter(task => task.status === 'acknowledged');
  const completedTasks = myTasks.filter(task => task.status === 'completed');

  const getTaskDate = (task: Task): Date | null => {
      if (task.dueDate) return new Date(task.dueDate);
      if (task.shiftId) {
          const shift = shiftsById.get(task.shiftId);
          return shift ? new Date(shift.date) : null;
      }
      return null;
  }

  const overdueTasks = [...pendingTasks, ...acknowledgedTasks].filter(task => {
      const taskDate = getTaskDate(task);
      return taskDate && isPast(taskDate) && !isToday(taskDate);
  });

  const todaysTasks = [...pendingTasks, ...acknowledgedTasks].filter(task => {
    const taskDate = getTaskDate(task);
    return taskDate && isToday(taskDate);
  });

  const upcomingTasks = [...pendingTasks, ...acknowledgedTasks].filter(task => {
      const taskDate = getTaskDate(task);
      return taskDate && isFuture(taskDate);
  });


  const handleAcknowledge = (taskId: string) => {
    setTasks(currentTasks => currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'acknowledged', acknowledgedAt: new Date() }
        : task
    ));
  };

  const handleComplete = (taskId: string) => {
     setTasks(currentTasks => currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'completed', completedAt: new Date() }
        : task
    ));
  };
  
  const sortedCompletedTasks = [...completedTasks].sort((a,b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>A list of tasks assigned to you or your shifts. Acknowledge them, then mark them as complete.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['upcoming-tasks', 'todays-tasks', 'overdue-tasks']} className="w-full space-y-4">
           <TaskSection
            title="Overdue Tasks"
            icon={CalendarX}
            tasks={overdueTasks}
            shifts={shifts}
            onAcknowledge={handleAcknowledge}
            onComplete={handleComplete}
            emptyMessage="No overdue tasks. Well done!"
            emptyIcon={ClipboardCheck}
          />
           <TaskSection
            title="Today's Tasks"
            icon={ClipboardCheck}
            tasks={todaysTasks}
            shifts={shifts}
            onAcknowledge={handleAcknowledge}
            onComplete={handleComplete}
            emptyMessage="No tasks scheduled for today."
            emptyIcon={ClipboardCheck}
          />
          <TaskSection
            title="Upcoming Tasks"
            icon={CalendarClock}
            tasks={upcomingTasks}
            shifts={shifts}
            onAcknowledge={handleAcknowledge}
            onComplete={handleComplete}
            emptyMessage="No upcoming tasks on the horizon."
            emptyIcon={ClipboardCheck}
          />
           <TaskSection
            title="Completed Tasks"
            icon={CalendarCheck}
            tasks={sortedCompletedTasks}
            shifts={shifts}
            onAcknowledge={handleAcknowledge}
            onComplete={handleComplete}
            emptyMessage="No tasks completed yet. Get to work!"
            emptyIcon={ClipboardCheck}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}
