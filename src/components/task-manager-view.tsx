
'use client';

import React, { useState, useMemo } from 'react';
import type { Task, Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { DatePicker } from './ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getFullName } from '@/lib/utils';
import { Badge } from './ui/badge';

type TaskManagerViewProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentUser: Employee;
  employees: Employee[];
};

const TaskItem = ({ task, onToggle, onEdit, onDelete, canModify }: { 
    task: Task; 
    onToggle: (id: string, checked: boolean) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    canModify: boolean;
}) => {
    const { toast } = useToast();
    const isCompleted = task.status === 'completed';
    const isOverdue = task.dueDate && !isCompleted && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
    
    return (
        <li className={cn("group flex items-start gap-3 rounded-md border p-4 transition-colors", 
            isCompleted && 'bg-muted/50 opacity-70',
            isOverdue && 'border-destructive/50'
        )}>
            <Checkbox
                id={`task-${task.id}`}
                className="mt-1"
                checked={isCompleted}
                onCheckedChange={(isChecked) => onToggle(task.id, !!isChecked)}
            />
            <div className="grid gap-1.5 leading-none flex-1">
                <label htmlFor={`task-${task.id}`} className={cn("font-medium cursor-pointer", isCompleted && 'line-through')}>
                    {task.title}
                </label>
                <p className={cn("text-muted-foreground text-sm", isCompleted && 'line-through')}>{task.description}</p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {task.scope === 'global' && <Badge variant="secondary">Global</Badge>}
                    {task.dueDate && (
                        <span className={cn(isOverdue && 'text-destructive font-semibold')}>
                            Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                    )}
                </div>
                 {task.completedAt && (
                    <p className="text-muted-foreground text-xs">
                        Completed on {format(new Date(task.completedAt), 'MMM d, yyyy @ p')}
                    </p>
                )}
            </div>
             {canModify && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(task.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </li>
    );
}

export default function TaskManagerView({ tasks, setTasks, currentUser, employees }: TaskManagerViewProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const { toast } = useToast();

  const myPersonalTasks = useMemo(() => 
    tasks.filter(t => t.scope === 'personal' && t.assigneeId === currentUser.id),
    [tasks, currentUser.id]
  );
  
  const globalTasks = useMemo(() =>
    tasks.filter(t => t.scope === 'global'),
    [tasks]
  );

  const handleTaskToggle = (taskId: string, isChecked: boolean) => {
    setTasks(currentTasks => currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: isChecked ? 'completed' : 'pending', completedAt: isChecked ? new Date() : undefined }
        : task
    ));
  };
  
  const handleOpenEditor = (task: Partial<Task> | null = null) => {
    setEditingTask(task);
    setIsEditorOpen(true);
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: 'Task Deleted', variant: 'destructive'});
  }

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (taskData.id) { // Editing existing task
        setTasks(prev => prev.map(t => t.id === taskData.id ? {...t, ...taskData} as Task : t));
        toast({ title: 'Task Updated' });
    } else { // Creating new task
        const newTask: Task = {
            id: `task-${Date.now()}`,
            status: 'pending',
            createdBy: currentUser.id,
            ...taskData,
        } as Task;
        setTasks(prev => [...prev, newTask]);
        toast({ title: 'Task Created' });
    }
    setIsEditorOpen(false);
  }
  
  const canCreateGlobal = currentUser.role === 'manager' || currentUser.role === 'admin';

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Task Manager</CardTitle>
            <CardDescription>Manage your personal and global tasks.</CardDescription>
        </div>
        <Button onClick={() => handleOpenEditor()}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Task
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold mb-2">My Personal Tasks</h3>
            {myPersonalTasks.length > 0 ? (
                <ul className="space-y-3">
                    {myPersonalTasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={handleTaskToggle}
                            onEdit={() => handleOpenEditor(task)}
                            onDelete={handleDeleteTask}
                            canModify={true}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>You have no personal tasks. Click "New Task" to create one.</p>
                </div>
            )}
        </div>
        <div>
            <h3 className="text-lg font-semibold mb-2">Global Tasks</h3>
             {globalTasks.length > 0 ? (
                <ul className="space-y-3">
                    {globalTasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={handleTaskToggle}
                            onEdit={() => handleOpenEditor(task)}
                            onDelete={handleDeleteTask}
                            canModify={task.createdBy === currentUser.id || canCreateGlobal}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>There are no global tasks assigned.</p>
                    {canCreateGlobal && <p className="text-sm">Managers and admins can create tasks for everyone.</p>}
                </div>
            )}
        </div>
      </CardContent>
    </Card>

    <TaskEditorDialog 
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        task={editingTask}
        onSave={handleSaveTask}
        currentUser={currentUser}
        employees={employees}
    />
    </>
  );
}


type TaskEditorDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    task: Partial<Task> | null;
    onSave: (taskData: Partial<Task>) => void;
    currentUser: Employee;
    employees: Employee[];
}

function TaskEditorDialog({ isOpen, setIsOpen, task, onSave, currentUser, employees }: TaskEditorDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [scope, setScope] = useState<'personal' | 'global'>('personal');
    const [assigneeId, setAssigneeId] = useState<string | null>(null);

    const canCreateGlobal = currentUser.role === 'manager' || currentUser.role === 'admin';

    useEffect(() => {
        if (isOpen) {
            setTitle(task?.title || '');
            setDescription(task?.description || '');
            setDueDate(task?.dueDate ? new Date(task.dueDate) : undefined);
            setScope(task?.scope === 'global' ? 'global' : 'personal');
            setAssigneeId(task?.assigneeId || currentUser.id);
        }
    }, [task, isOpen, currentUser.id]);

    const handleSave = () => {
        const finalScope = canCreateGlobal ? scope : 'personal';
        const finalAssignee = finalScope === 'global' ? null : assigneeId;
        onSave({
            id: task?.id,
            title,
            description,
            dueDate,
            scope: finalScope,
            assigneeId: finalAssignee,
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{task?.id ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                    <DialogDescription>Fill out the details for the task below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Due Date</Label>
                        <DatePicker date={dueDate} onDateChange={setDueDate} />
                    </div>
                    {canCreateGlobal && (
                        <div className="space-y-2">
                            <Label>Scope</Label>
                            <Select value={scope} onValueChange={(v) => setScope(v as 'personal' | 'global')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="personal">Personal (Just for me)</SelectItem>
                                    <SelectItem value="global">Global (For everyone)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!title}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
