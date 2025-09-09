
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

type AlafTemplateUploaderProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTemplateUpload: (templateData: string) => void;
};

export function AlafTemplateUploader({ isOpen, setIsOpen, onTemplateUpload }: AlafTemplateUploaderProps) {
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
      toast({ title: 'No file selected', description: 'Please select a PDF file to upload.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = e.target?.result as ArrayBuffer;
            if (!data) {
                throw new Error("Failed to read file data.");
            }
            // Convert ArrayBuffer to Base64 string
            const base64String = btoa(new Uint8Array(data).reduce((data, byte) => data + String.fromCharCode(byte), ''));

            onTemplateUpload(base64String);
            toast({ title: 'Template Uploaded', description: 'The new ALAF template has been saved.' });
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
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload ALAF Template</DialogTitle>
           <DialogDescription>
            Upload your Application for Leave of Absence Form (ALAF) in PDF format. The system will find and replace placeholders to fill in the data.
          </DialogDescription>
        </DialogHeader>
        <Alert>
            <AlertTitle>Template Instructions</AlertTitle>
            <AlertDescription>
                <p className="text-xs mt-2">Ensure your PDF form has fields with the following names. The system will automatically fill these fields.</p>
                <p className="text-xs mt-2 font-semibold">Text Fields:</p>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                    <li><code>employee_name</code></li>
                    <li><code>date_filed</code></li>
                    <li><code>department</code></li>
                    <li><code>employee_id</code></li>
                    <li><code>leave_dates</code></li>
                    <li><code>total_days</code></li>
                    <li><code>reason</code></li>
                    <li><code>contact_info</code></li>
                    <li><code>approval_status</code></li>
                    <li><code>approval_date</code></li>
                </ul>
                 <p className="text-xs mt-2 font-semibold">Checkbox Fields:</p>
                 <p className="text-xs mt-1">For leave types, create checkboxes. The name of the checkbox field must exactly match the "Type" you define in the "Manage Leave Types" editor (e.g., "Vacation Leave", "Sick Leave").</p>
                 <p className="text-xs mt-2 font-semibold">Image Fields (for signatures):</p>
                 <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                    <li><code>employee_signature</code></li>
                    <li><code>manager_signature</code></li>
                 </ul>
            </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
            <Label htmlFor="template-file">PDF Template File</Label>
            <Input id="template-file" type="file" onChange={handleFileChange} accept=".pdf" />
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
