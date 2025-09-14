

'use client';

import React, { useState, useEffect } from 'react';
import type { Task } from '@/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';

type TaskEditorProps = {
  editingTask: Partial<Task> | null;
  onSaveTask: (taskData: { title: string; description: string }) => void;
  onCancelEdit: () => void;
  shiftId: string;
};

export function TaskEditor({ editingTask, onSaveTask, onCancelEdit, shiftId }: TaskEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setTitle(editingTask?.title || '');
    setDescription(editingTask?.description || '');
  }, [editingTask]);

  const handleSave = () => {
    if (!title) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    onSaveTask({ title, description });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <h4 className="font-semibold">{editingTask?.id ? 'Edit Task' : 'Add New Task'}</h4>
        <Input placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Task Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-2">
          {editingTask && <Button variant="ghost" onClick={onCancelEdit}>Cancel Edit</Button>}
          <Button onClick={handleSave} disabled={!title}>{editingTask?.id ? 'Save Changes' : 'Add Task'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
