
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Note, Holiday } from '@/types';
import { format } from 'date-fns';
import { Pencil } from 'lucide-react';

type NoteViewerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | Holiday;
  isManager: boolean;
  onEdit: (note: Note) => void;
};

function isHoliday(note: Note | Holiday): note is Holiday {
    return !('description' in note);
}

export function NoteViewer({ isOpen, setIsOpen, note, isManager, onEdit }: NoteViewerProps) {
  if (!note) return null;

  const formattedDate = note.date ? format(new Date(note.date), 'EEEE, MMMM d, yyyy') : '';
  const isNoteHoliday = isHoliday(note);
  const description = isNoteHoliday ? '' : note.description;

  const handleEditClick = () => {
    if (isNoteHoliday) return; // Holidays are not editable here
    setIsOpen(false);
    onEdit(note);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{note.title}</DialogTitle>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>
        <div className="py-4 whitespace-pre-wrap">
            <p>{description}</p>
        </div>
        <DialogFooter className="sm:justify-between">
            <div>
                 {isManager && !isNoteHoliday && (
                    <Button type="button" onClick={handleEditClick}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Note
                    </Button>
                )}
            </div>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Close
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
