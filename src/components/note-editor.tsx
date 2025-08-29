
'use client';

import React, { useEffect } from 'react';
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
import { Input } from './ui/input';
import { Trash2 } from 'lucide-react';
import type { Note } from '@/types';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';

const noteSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: 'A date is required.' }),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
});

type NoteEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Partial<Note> | null;
  onSave: (note: Note | Partial<Note>) => void;
  onDelete: (noteId: string) => void;
};

export function NoteEditor({ isOpen, setIsOpen, note, onSave, onDelete }: NoteEditorProps) {
  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      id: note?.id || undefined,
      date: note?.date || new Date(),
      title: note?.title || '',
      description: note?.description || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: note?.id || undefined,
        date: note?.date ? new Date(note.date) : new Date(),
        title: note?.title || '',
        description: note?.description || '',
      });
    }
  }, [note, isOpen, form]);

  const onSubmit = (values: z.infer<typeof noteSchema>) => {
    onSave(values);
  };

  const handleDelete = () => {
    if (note?.id) {
      onDelete(note.id);
    }
  };

  const formattedDate = note?.date ? format(note.date, 'EEEE, MMMM d') : '';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{note?.id ? `Edit Note for ${formattedDate}` : `Add Note for ${formattedDate}`}</DialogTitle>
          <DialogDescription>
            Add a title and description for this day's note.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Important Reminders" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="e.g., Staff meeting at 10am." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-between">
              {note?.id ? (
                <Button type="button" variant="destructive" onClick={handleDelete} className="sm:mr-auto">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              ) : <div></div>}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
