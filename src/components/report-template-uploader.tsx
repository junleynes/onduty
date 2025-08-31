
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

type ReportTemplateUploaderProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTemplateUpload: (templateData: string) => void;
};

export function ReportTemplateUploader({ isOpen, setIsOpen, onTemplateUpload }: ReportTemplateUploaderProps) {
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
            localStorage.setItem('workScheduleTemplate', data);
            onTemplateUpload(data);
            toast({ title: 'Template Uploaded', description: 'The new work schedule template has been saved.' });
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
          <DialogTitle>Upload Work Schedule Template</DialogTitle>
           <DialogDescription>
            Upload your formatted .xlsx file. The system will find and replace placeholders to fill in the data for the selected date range.
          </DialogDescription>
        </DialogHeader>
        <Alert>
            <AlertTitle>Template Placeholders</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                    <li><b>Global Placeholders:</b> These can be anywhere in the sheet, typically in a title or header area.
                        <ul className="list-disc pl-5">
                             <li>`{'{{start_date}}'}` - The start of the covered period.</li>
                             <li>`{'{{end_date}}'}` - The end of the covered period.</li>
                        </ul>
                    </li>
                     <li><b>Row Placeholders:</b> Create one row in your template that contains these placeholders. The system will duplicate this row for each employee for each day in your selected date range.
                        <ul className="list-disc pl-5">
                            <li>`{'{{employee_name}}'}` - Full name of the employee. (This is required to identify the template row).</li>
                            <li>`{'{{date}}'}` - The date for the specific row.</li>
                            <li>`{'{{schedule_start}}'}` - Shift start time.</li>
                            <li>`{'{{schedule_end}}'}` - Shift end time.</li>
                            <li>`{'{{unpaidbreak_start}}'}` / `{'{{unpaidbreak_end}}'}`</li>
                            <li>`{'{{paidbreak_start}}'}` / `{'{{paidbreak_end}}'}`</li>
                             <li>`{'{{day_status}}'}` - Will show status like "OFF", "HOLIDAY OFF", or be empty.</li>
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
