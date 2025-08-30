
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
            Upload your formatted .xlsx file. The system will find and replace placeholders to fill in the data while preserving your formatting.
          </DialogDescription>
        </DialogHeader>
        <Alert>
            <AlertTitle>Available Placeholders</AlertTitle>
            <AlertDescription>
                <p className="text-xs mt-2">Use these placeholders in your Excel template. The system will replace them with the correct data.</p>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                    <li><b>Header Placeholders:</b>
                        <ul className="list-disc pl-5">
                             <li>`{{month}}` - The current month and year (e.g., October 2024).</li>
                             <li>`{{group}}` - The name of the current user's group.</li>
                             <li>`{{day_1}}`...`{{day_7}}` - The day number for each day of the week.</li>
                        </ul>
                    </li>
                     <li><b>Row Placeholders (repeat for each employee):</b>
                        <ul className="list-disc pl-5">
                            <li>`{{employee_1}}`, `{{employee_2}}`, etc.</li>
                             <li>You can place `{{group}}` in the group column for each row if needed.</li>
                            <li>`{{position_1}}`, `{{position_2}}`, etc.</li>
                            <li>`{{schedule_1_1}}` to `{{schedule_1_7}}` for the first employee's 7 days of schedule codes.</li>
                            <li>`{{schedule_2_1}}` to `{{schedule_2_7}}` for the second employee.</li>
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
