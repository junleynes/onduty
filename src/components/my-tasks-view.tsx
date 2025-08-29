
'use client';

import React from 'react';
import type { Task, Shift, Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import { ClipboardCheck, CalendarClock, CalendarX, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type MyTasksViewProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  shifts: Shift[];
  currentUser: Employee | null;
};

const TaskItem = ({ task, shift, onToggle }: { task: Task; shift?: Shift; onToggle: (id: string, checked: boolean) => void; }) => {
    const isCompleted = task.status === 'completed';
    return (
        <li className={cn("flex items-start gap-3 rounded-md border p-4", isCompleted && 'opacity-70')}>
            <Checkbox
                id={`task-${task.id}`}
                className="mt-1"
                checked={isCompleted}
                onCheckedChange={(isChecked) => onToggle(task.id, !!isChecked)}
            />
            <div className="grid gap-1.5 leading-none">
                <label htmlFor={`task-${task.id}`} className={cn("font-medium cursor-pointer", isCompleted && 'line-through')}>
                    {task.title}
                </label>
                <p className={cn("text-muted-foreground text-sm", isCompleted && 'line-through')}>{task.description}</p>
                {shift && (
                    <p className="text-muted-foreground text-xs">
                        For shift on {format(new Date(shift.date), 'MMM d, yyyy')} ({shift.startTime} - {shift.endTime})
                    </p>
                )}
                 {task.completedAt && (
                    <p className="text-muted-foreground text-xs">
                        Completed on {format(new Date(task.completedAt), 'MMM d, yyyy @ p')}
                    </p>
                )}
            </div>
        </li>
    );
}

const TaskSection = ({ title, icon: Icon, tasks, shifts, onToggle, emptyMessage, emptyIcon: EmptyIcon }: { 
    title: string;
    icon: React.ElementType;
    tasks: Task[];
    shifts: Shift[];
    onToggle: (id: string, checked: boolean) => void;
    emptyMessage: string;
    emptyIcon: React.ElementType;
}) => {
     const getShiftForTask = (taskId: string): Shift | undefined => {
        const task = tasks.find(t => t.id === taskId);
        return shifts.find(s => s.id === task?.shiftId);
    }
    
    return (
        <Card>
            <AccordionItem value={title.toLowerCase().replace(' ', '-')}>
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
                                <TaskItem key={task.id} task={task} shift={getShiftForTask(task.id)} onToggle={onToggle} />
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
  const myTasks = tasks.filter(task => myShiftIds.has(task.shiftId));
  
  const shiftsById = new Map(shifts.map(s => [s.id, s]));
  const today = startOfDay(new Date());

  const pendingTasks = myTasks.filter(task => task.status === 'pending');
  const completedTasks = myTasks.filter(task => task.status === 'completed');

  const todaysTasks = pendingTasks.filter(task => {
    const shift = shiftsById.get(task.shiftId);
    return shift && isToday(new Date(shift.date));
  });

  const upcomingTasks = pendingTasks.filter(task => {
      const shift = shiftsById.get(task.shiftId);
      return shift && isFuture(new Date(shift.date));
  });

  const overdueTasks = pendingTasks.filter(task => {
      const shift = shiftsById.get(task.shiftId);
      return shift && isPast(new Date(shift.date)) && !isToday(new Date(shift.date));
  })

  const handleTaskToggle = (taskId: string, isChecked: boolean) => {
    setTasks(currentTasks => currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: isChecked ? 'completed' : 'pending', completedAt: isChecked ? new Date() : undefined }
        : task
    ));
  };
  
  const sortedCompletedTasks = [...completedTasks].sort((a,b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>A list of tasks assigned to your shifts. Check them off as you complete them.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['overdue-tasks', 'todays-tasks', 'upcoming-tasks', 'completed-tasks']} className="w-full space-y-4">
          <TaskSection
            title="Overdue Tasks"
            icon={CalendarX}
            tasks={overdueTasks}
            shifts={shifts}
            onToggle={handleTaskToggle}
            emptyMessage="No overdue tasks. Well done!"
            emptyIcon={ClipboardCheck}
          />
           <TaskSection
            title="Today's Tasks"
            icon={ClipboardCheck}
            tasks={todaysTasks}
            shifts={shifts}
            onToggle={handleTaskToggle}
            emptyMessage="No tasks scheduled for today."
            emptyIcon={ClipboardCheck}
          />
           <TaskSection
            title="Upcoming Tasks"
            icon={CalendarClock}
            tasks={upcomingTasks}
            shifts={shifts}
            onToggle={handleTaskToggle}
            emptyMessage="No upcoming tasks on the horizon."
            emptyIcon={ClipboardCheck}
          />
           <TaskSection
            title="Completed Tasks"
            icon={CalendarCheck}
            tasks={sortedCompletedTasks}
            shifts={shifts}
            onToggle={handleTaskToggle}
            emptyMessage="No tasks completed yet. Get to work!"
            emptyIcon={ClipboardCheck}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}
