
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
import type { Employee } from '@/types';
import { findEmployeeByName } from '@/lib/utils';
import { isDate } from 'date-fns';

export type ImportedAllowance = {
    employeeId: string;
    loadAllocation: number;
    balance: number;
    asOfDate?: Date;
}

type AllowanceImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (importedData: ImportedAllowance[]) => void;
  employees: Employee[];
};

export function AllowanceImporter({ isOpen, setIsOpen, onImport, employees }: AllowanceImporterProps) {
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
          
          const requiredHeaders = ['Recipient', 'Load Allocation', 'Load Balance'];
          const headers = results.meta.fields || [];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns in CSV: ${missingHeaders.join(', ')}`);
          }

          const importedData: ImportedAllowance[] = [];
          
          results.data.forEach((row: any) => {
            const employee = findEmployeeByName(row['Recipient'], employees);
            if (!employee) {
                console.warn(`Employee "${row['Recipient']}" not found. Skipping row.`);
                return;
            }

            const loadAllocation = parseFloat(row['Load Allocation']);
            const balance = parseFloat(row['Load Balance']);
            
            // Check for both quoted and unquoted header for "Balance As Of"
            const asOfDateStr = row['"Balance As Of"'] || row['Balance As Of'];

            // The date constructor can handle 'YYYY-MM-DD' strings directly.
            // isDate is a good check to ensure it's a valid date object afterwards.
            const asOfDate = asOfDateStr && isDate(new Date(asOfDateStr)) ? new Date(asOfDateStr) : undefined;

            if (isNaN(loadAllocation) || isNaN(balance)) {
                console.warn(`Invalid number format for employee "${row['Recipient']}". Skipping row.`);
                return;
            }
            
            importedData.push({
                employeeId: employee.id,
                loadAllocation,
                balance,
                asOfDate,
            });
          });
          
          if (importedData.length === 0) {
              throw new Error("No valid data could be parsed. Check employee names and number formats.");
          }

          onImport(importedData);
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
          <DialogTitle>Import Allowances from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with headers: Recipient, Load Allocation, Load Balance. Optionally include 'Balance As Of'. This will update allocations and set the balance for the current month.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Label htmlFor="allowance-file">CSV File</Label>
            <Input id="allowance-file" type="file" onChange={handleFileChange} accept=".csv" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
