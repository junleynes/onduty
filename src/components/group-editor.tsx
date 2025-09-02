
'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
});

const formSchema = z.object({
  groups: z.array(groupSchema),
});

type GroupEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  groups: string[];
  setGroups: React.Dispatch<React.SetStateAction<string[]>>;
};

export function GroupEditor({ isOpen, setIsOpen, groups, setGroups }: GroupEditorProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: groups.map(name => ({ name })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'groups',
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ groups: groups.map(name => ({ name })) });
    }
  }, [isOpen, groups, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const newGroups = values.groups.map(g => g.name);
    const uniqueGroups = [...new Set(newGroups)];
    if (uniqueGroups.length !== newGroups.length) {
        toast({ title: 'Duplicate Names', description: 'Group names must be unique.', variant: 'destructive' });
        return;
    }
    setGroups(uniqueGroups);
    setIsOpen(false);
    toast({ title: 'Groups Updated' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
          <DialogDescription>
            Add, edit, or remove groups for organizing your team members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-72 pr-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`groups.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="sr-only">Group Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
             <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: '' })}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Group
            </Button>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
