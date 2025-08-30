

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
            Upload your formatted .xlsx file. The system will find and replace placeholders to fill in the data.
          </DialogDescription>
        </DialogHeader>
        <Alert>
            <AlertTitle>Available Placeholders</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                    <li>`{`{{group}}`}` - The name of the group for the report.</li>
                    <li>`{`{{week_of}}`}` - The date range of the week.</li>
                    <li>`{`{{day_1}}`}`...`{`{{day_7}}`}` - The day number for each day of the week.</li>
                    <li>`{`{{employee_1}}`}`, `{`{{position_1}}`}` - Info for the first employee.</li>
                    <li>`{`{{employee_2}}`}`, `{`{{position_2}}`}` - Info for the second employee, etc.</li>
                     <li>`{`{{schedule_1_1}}`}`...`{`{{schedule_1_7}}`}` - Schedule codes for employee 1.</li>
                     <li>`{`{{schedule_2_1}}`}`...`{`{{schedule_2_7}}`}` - Schedule codes for employee 2, etc.</li>
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
