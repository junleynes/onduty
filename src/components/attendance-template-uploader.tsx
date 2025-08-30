
'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type AttendanceTemplateUploaderProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTemplateUpload: (templateData: string) => void;
};

export function AttendanceTemplateUploader({ isOpen, setIsOpen, onTemplateUpload }: AttendanceTemplateUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select an XLSX file to upload.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            if (typeof data !== 'string') {
                throw new Error("Failed to read file data.");
            }
            // Store the raw binary string
            localStorage.setItem('attendanceSheetTemplate', data);
            onTemplateUpload(data);
            toast({ title: 'Template Uploaded', description: 'The new attendance sheet template has been saved.' });
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Upload Failed', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };
    
    reader.onerror = (error) => {
        console.error(error);
        toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Attendance Sheet Template</DialogTitle>
          <DialogDescription>
            Upload your formatted .xlsx file. The system will inject data starting from the {'\'{{data_start}}\''} placeholder.
          </DialogDescription>
        </DialogHeader>
        <Alert>
            <AlertTitle>Template Instructions</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                    <li><b>Header Placeholders:</b> The system will find and replace these text placeholders anywhere in your sheet.
                        <ul className="list-disc pl-5">
                             <li>`{'{{month}}'}` - Replaced with the current month and year (e.g., October 2024).</li>
                             <li>`{'{{group}}'}` - Replaced with the name of the current user's group.</li>
                             <li>`{'{{day_1}}'}`...`{'{{day_7}}'}` - Replaced with the day number for each day of the week.</li>
                        </ul>
                    </li>
                     <li><b>Data Start Placeholder:</b>
                        <ul className="list-disc pl-5">
                            <li>Place `{'{{data_start}}'}` in the first cell where employee data should begin (e.g., the cell for the first employee's name).</li>
                            <li>The system will insert new rows for each employee, cloning the styles and height from the row that contains `{'{{data_start}}'}`.</li>
                            <li>The data columns generated are: `Name`, and 7 `Schedule Code` columns. Ensure your template row has enough columns for the name and the 7 days of the week.</li>
                        </ul>
                    </li>
                </ul>
            </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
            <Label htmlFor="template-file">XLSX Template File</Label>
            <Input id="template-file" type="file" onChange={handleFileChange} accept=".xlsx" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
