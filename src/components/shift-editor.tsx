
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
import { Input } from '@/components/ui/input';
import { FileText, MoreHorizontal, Pencil, Copy, Trash2, X, PlusCircle, ClipboardCheck } from 'lucide-react';
import { getFullName } from '@/lib/utils';
import type { Employee, Shift, Task } from '@/types';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from './ui/date-picker';
import { Textarea } from './ui/textarea';


const shiftSchema = z.object({
  employeeId: z.string().nullable(),
  label: z.string().optional(),
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  color: z.string().optional(),
  id: z.string().optional(),
  isDayOff: z.boolean().default(false),
  isHolidayOff: z.boolean().default(false),
}).refine(data => {
    if (data.isDayOff || data.isHolidayOff) return true;
    return !!data.label && !!data.startTime && !!data.endTime;
}, {
    message: "Label, start time, and end time are required for shifts.",
    path: ["label"],
});


export type ShiftTemplate = {
  name: string;
  label: string;
  startTime: string;
  endTime: string;
  color: string;
};

type ShiftEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shift: Shift | Partial<Shift> | null;
  onSave: (shift: Shift | Partial<Shift>) => void;
  onDelete: (shiftId: string) => void;
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  setShiftTemplates: React.Dispatch<React.SetStateAction<ShiftTemplate[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentUser: Employee;
};

const roleColors: { [key: string]: string } = {
  Manager: 'hsl(var(--chart-1))',
  Chef: 'hsl(var(--chart-1))',
  Barista: 'hsl(var(--chart-5))',
  Cashier: 'hsl(var(--chart-3))',
};

const shiftColorOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Orange', value: 'hsl(var(--chart-4))' },
    { label: 'Red', value: 'hsl(var(--chart-1))' },
    { label: 'Blue', value: '#3498db' },
    { label: 'Green', value: 'hsl(var(--chart-2))' },
    { label: 'Purple', value: '#9b59b6' },
    { label: 'Pink', value: '#e91e63' },
    { label: 'Yellow', value: '#f1c40f' },
    { label: 'White', value: '#ffffff' },
    { label: 'Dark Grayish Blue', value: '#6b7280' },
];


export function ShiftEditor({ isOpen, setIsOpen, shift, onSave, onDelete, employees, shiftTemplates, setShiftTemplates, tasks, setTasks, currentUser }: ShiftEditorProps) {
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const selectedEmployee = employees.find(e => e.id === shift?.employeeId);
  const defaultColor = selectedEmployee ? roleColors[selectedEmployee.position] : '';

  const form = useForm<z.infer<typeof shiftSchema>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      id: shift?.id || undefined,
      employeeId: shift?.employeeId || null,
      label: shift?.label || '',
      date: shift?.date || new Date(),
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      color: shift?.color || defaultColor,
      isDayOff: shift?.isDayOff || false,
      isHolidayOff: shift?.isHolidayOff || false,
    },
  });

  useEffect(() => {
    const selectedEmployee = employees.find(e => e.id === shift?.employeeId);
    const defaultColor = selectedEmployee ? roleColors[selectedEmployee.position] : shiftColorOptions[1].value;
    if (!editingTemplate) {
        form.reset({
        id: shift?.id || undefined,
        employeeId: shift?.employeeId || null,
        label: shift?.label || '',
        date: shift?.date || new Date(),
        startTime: shift?.startTime || '',
        endTime: shift?.endTime || '',
        color: shift?.color || defaultColor,
        isDayOff: shift?.isDayOff || false,
        isHolidayOff: shift?.isHolidayOff || false,
        });
    }
  }, [shift, form, employees, editingTemplate]);

  useEffect(() => {
    if (editingTask) {
        setTaskTitle(editingTask.title || '');
        setTaskDescription(editingTask.description || '');
    } else {
        setTaskTitle('');
        setTaskDescription('');
    }
  }, [editingTask]);


  const handleEditTemplate = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    form.setValue('label', template.label);
    form.setValue('startTime', template.startTime);
    form.setValue('endTime', template.endTime);
    form.setValue('color', template.color);
    setActiveTab('details');
  };
  
  const tasksForShift = shift?.id ? tasks.filter(t => t.shiftId === shift.id) : [];

  const handleSaveTask = () => {
    if (!taskTitle || !shift?.id) return;
    const taskData: Partial<Task> = {
        title: taskTitle,
        description: taskDescription,
    };
    if (editingTask?.id) {
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
        toast({ title: "Task Updated" });
    } else {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            shiftId: shift.id,
            scope: 'shift',
            status: 'pending',
            createdBy: currentUser.id,
            title: taskTitle,
            description: taskDescription,
        };
        setTasks([...tasks, newTask]);
        toast({ title: "Task Added" });
    }
    setEditingTask(null);
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    toast({ title: "Task Deleted", variant: 'destructive' });
  }

  const onSubmit = (values: z.infer<typeof shiftSchema>) => {
    if (editingTemplate) {
        const formValues = form.getValues();
        const updatedTemplate = {
            ...editingTemplate,
            name: `${formValues.label} (${formValues.startTime}-${formValues.endTime})`,
            label: formValues.label || editingTemplate.label,
            startTime: formValues.startTime || editingTemplate.startTime,
            endTime: formValues.endTime || editingTemplate.endTime,
            color: formValues.color || editingTemplate.color,
        };
        setShiftTemplates(prev => 
            prev.map(t => t.name === editingTemplate.name ? updatedTemplate : t)
        );
        toast({ title: 'Template Updated', description: `The "${updatedTemplate.name}" template has been updated.` });
        setEditingTemplate(null);
        return;
    }

    const finalValues = { ...values };
    if (values.isDayOff) {
        finalValues.label = 'OFF';
        finalValues.startTime = '';
        finalValues.endTime = '';
        finalValues.color = '#6b7280';
    } else if (values.isHolidayOff) {
        finalValues.label = 'HOL-OFF';
        finalValues.startTime = '';
        finalValues.endTime = '';
        finalValues.color = '#6b7280';
    } else if (finalValues.color === 'default' || !finalValues.color) {
        const employee = employees.find(e => e.id === values.employeeId);
        finalValues.color = employee ? roleColors[employee.position] : shiftColorOptions[1].value;
    }
    onSave(finalValues);
  };

  const handleDelete = () => {
    if (shift?.id) {
        onDelete(shift.id);
    }
  }
  
  const isDayOff = form.watch('isDayOff');
  const isHolidayOff = form.watch('isHolidayOff');

  const handleTemplateClick = (template: typeof shiftTemplates[0]) => {
    form.setValue('label', template.label);
    form.setValue('startTime', template.startTime);
    form.setValue('endTime', template.endTime);
    form.setValue('color', template.color);
    toast({ title: 'Template Applied', description: `The "${template.name}" template has been applied.`});
  }

  const handleDuplicateTemplate = (templateToDuplicate: typeof shiftTemplates[0]) => {
    const newTemplate = { ...templateToDuplicate, name: `${templateToDuplicate.name} (Copy)` };
    setShiftTemplates(prev => [...prev, newTemplate]);
    toast({ title: 'Template Duplicated' });
  };

  const handleDeleteTemplate = (templateNameToDelete: string) => {
    setShiftTemplates(prev => prev.filter(t => t.name !== templateNameToDelete));
    toast({ title: 'Template Deleted', variant: 'destructive' });
  };

  const handleSaveAsTemplate = () => {
    const currentValues = form.getValues();
    if (currentValues.isDayOff || currentValues.isHolidayOff || !currentValues.label || !currentValues.startTime || !currentValues.endTime) {
        toast({ title: 'Cannot Save Template', description: 'Please provide a label, start time, and end time for a working shift.', variant: 'destructive' });
        return;
    }
    const newTemplate = {
        name: `${currentValues.label} (${currentValues.startTime}-${currentValues.endTime})`,
        label: currentValues.label,
        startTime: currentValues.startTime,
        endTime: currentValues.endTime,
        color: currentValues.color || 'default',
    };
    setShiftTemplates(prev => [...prev, newTemplate]);
    toast({ title: 'Template Saved', description: `New template "${newTemplate.name}" has been created.` });
  }

  const cancelEditTemplate = () => {
    setEditingTemplate(null);
    form.reset({
        id: shift?.id || undefined,
        employeeId: shift?.employeeId || null,
        label: shift?.label || '',
        date: shift?.date || new Date(),
        startTime: shift?.startTime || '',
        endTime: shift?.endTime || '',
        color: shift?.color || defaultColor,
        isDayOff: shift?.isDayOff || false,
        isHolidayOff: shift?.isHolidayOff || false,
    });
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) {
            setEditingTemplate(null);
            cancelEditTemplate();
        }
        setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? `Editing Template: ${editingTemplate.name}` : (shift?.id ? 'Edit Shift' : 'Add New Shift')}</DialogTitle>
          <DialogDescription>
            {editingTemplate ? "Modify the template details below." : (shift?.id ? "Update the details for this shift." : "Fill in the details for the new shift.")}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="tasks" disabled={!shift?.id || isDayOff || isHolidayOff}>Tasks</TabsTrigger>
                <TabsTrigger value="templates" disabled={!!editingTemplate}>Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {!editingTemplate && (
                            <>
                            <FormField
                                control={form.control}
                                name="employeeId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Employee</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(value === 'unassigned' ? null : value)} defaultValue={field.value || 'unassigned'}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an employee" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value={'unassigned'}>Unassigned</SelectItem>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{getFullName(emp)}</SelectItem>
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
                                        onDateChange={field.onChange}
                                    />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <div className="flex gap-4">
                                <FormField
                                    control={form.control}
                                    name="isDayOff"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    if (checked) form.setValue('isHolidayOff', false);
                                                }}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                OFF
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isHolidayOff"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    if (checked) form.setValue('isDayOff', false);
                                                }}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                HOL-OFF
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            </>
                        )}
                        

                        {(!isDayOff && !isHolidayOff || editingTemplate) && (
                        <>
                            <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Shift Label</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Morning Shift" {...field} />
                                </FormControl>
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
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
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
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Shift Color</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a color" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {shiftColorOptions.map(option => (
                                        <SelectItem key={option.label} value={option.value}>
                                        <div className="flex items-center gap-2">
                                                {option.value && option.value !== 'default' && <div className="w-4 h-4 rounded-full border" style={{backgroundColor: option.value}} />}
                                                <span>{option.label}</span>
                                        </div>
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </>
                        )}
                        <DialogFooter className="flex w-full flex-row sm:justify-between items-center">
                            <div className="flex items-center">
                                {shift?.id && !editingTemplate && (
                                    <Button type="button" variant="destructive" onClick={handleDelete} className="mr-auto">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                                {editingTemplate && (
                                    <Button type="button" variant="ghost" onClick={cancelEditTemplate} className="mr-auto">
                                        <X className="mr-2 h-4 w-4" />
                                        Cancel Edit
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                               {!editingTemplate && (
                                <Button type="button" variant="outline" onClick={handleSaveAsTemplate} disabled={isDayOff || isHolidayOff}>
                                    Save as Template
                                </Button>
                               )}
                               <Button type="submit">{editingTemplate ? "Save Template" : "Save Shift"}</Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="tasks">
                <div className="space-y-4 py-4">
                    <Card>
                        <CardContent className="p-4 space-y-2">
                             <h4 className="font-semibold">{editingTask ? 'Edit Task' : 'Add New Task'}</h4>
                             <Input placeholder="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                             <Textarea placeholder="Task Description (optional)" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
                             <div className="flex justify-end gap-2">
                                 {editingTask && <Button variant="ghost" onClick={() => setEditingTask(null)}>Cancel Edit</Button>}
                                 <Button onClick={handleSaveTask} disabled={!taskTitle}>{editingTask ? 'Save Changes' : 'Add Task'}</Button>
                             </div>
                        </CardContent>
                    </Card>
                    <h4 className="font-semibold pt-4">Assigned Tasks</h4>
                    <ScrollArea className="h-48">
                        <div className="space-y-2 pr-4">
                            {tasksForShift.length > 0 ? tasksForShift.map(task => (
                                <Card key={task.id} className="p-3 group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{task.title}</p>
                                            <p className="text-sm text-muted-foreground">{task.description}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTask(task)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTask(task.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No tasks assigned to this shift yet.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </TabsContent>
            <TabsContent value="templates">
                <ScrollArea className="h-96">
                    <div className="space-y-2 p-4">
                        {shiftTemplates.map((template) => (
                           <Card key={template.name} className="p-3 hover:bg-muted group">
                               <div className="flex items-center justify-between">
                                   <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => handleTemplateClick(template)}>
                                       <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                                       <div>
                                         <p className="font-semibold">{template.name}</p>
                                         <p className="text-sm text-muted-foreground">{template.startTime} - {template.endTime}</p>
                                         <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: template.color }}></span> 
                                            Label: {template.label}
                                         </p>
                                       </div>
                                   </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                <span>Duplicate</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteTemplate(template.name)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                               </div>
                           </Card>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
}
