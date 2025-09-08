
'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import type { LeaveTypeOption } from './leave-type-editor';

type LeaveTypeImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (newLeaveTypes: LeaveTypeOption[]) => void;
};

const colorNameToHex: { [key: string]: string } = {
    "black": "#000000",
    "white": "#ffffff",
    "red": "#ef4444",
    "green": "#22c55e",
    "blue": "#3b82f6",
    "yellow": "#eab308",
    "orange": "#f97316",
    "purple": "#8b5cf6",
    "pink": "#d946ef",
    "teal": "#14b8a6",
    "cyan": "#06b6d4",
    "gray": "#6b7280",
};

const normalizeColor = (colorStr: string): string => {
    if (!colorStr) return '#000000';
    const lowerColor = colorStr.toLowerCase().trim();
    if (lowerColor.startsWith('#')) {
        return lowerColor;
    }
    return colorNameToHex[lowerColor] || '#000000';
};

export function LeaveTypeImporter({ isOpen, setIsOpen, onImport }: LeaveTypeImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a CSV file to import.', variant: 'destructive' });
      return;
    }
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length) {
            console.error("CSV parsing errors:", results.errors);
            throw new Error(`Error parsing CSV on row ${results.errors[0].row}: ${results.errors[0].message}`);
          }
          
          const requiredHeaders = ['Type', 'Color'];
          const headers = results.meta.fields || [];
          const missingHeaders = requiredHeaders.filter(h => !headers.map(h=>h.toLowerCase()).includes(h.toLowerCase()));

          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns in CSV: ${missingHeaders.join(', ')}`);
          }

          const newLeaveTypes: LeaveTypeOption[] = results.data.map((row: any) => {
            const type = row['Type'] || row['type'];
            const color = row['Color'] || row['color'];
            if (!type) {
                return null;
            }
            return {
              type: type,
              color: normalizeColor(color),
            };
          }).filter(Boolean) as LeaveTypeOption[];
          
          if (newLeaveTypes.length === 0) {
              throw new Error("No valid leave type data could be parsed from the file.");
          }

          onImport(newLeaveTypes);
          setIsOpen(false);

        } catch (error) {
          console.error("Import failed:", error);
          toast({ title: 'Import Failed', description: (error as Error).message, variant: 'destructive' });
        } finally {
          setIsImporting(false);
          setFile(null);
        }
      },
      error: (error) => {
        toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
        setIsImporting(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Leave Types from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with leave type data. Required headers are: Type, Color.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Label htmlFor="leave-type-file">CSV File</Label>
            <Input id="leave-type-file" type="file" onChange={handleFileChange} accept=".csv" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Leave Types
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
