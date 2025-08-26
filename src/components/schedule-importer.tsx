
'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
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
import type { Shift, Leave } from '@/types';
import { employees } from '@/lib/data';

type ScheduleImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (importedShifts: Shift[], importedLeave: Leave[]) => void;
};

const normalizeName = (name: string) => {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const findEmployeeByName = (name: string) => {
    if (!name) return null;
    const normalizedInput = normalizeName(name);
    return employees.find(emp => {
        // Match against "Last, First M" or "First Last"
        const lastNameFirst = normalizeName(`${emp.lastName}, ${emp.firstName} ${emp.middleInitial || ''}`);
        const firstNameLast = normalizeName(`${emp.firstName} ${emp.lastName}`);
        return lastNameFirst.startsWith(normalizedInput) || firstNameLast.startsWith(normalizedInput);
  });
};

export function ScheduleImporter({ isOpen, setIsOpen, onImport }: ScheduleImporterProps) {
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
      toast({ title: 'No file selected', description: 'Please select an XLSX file to import.', variant: 'destructive' });
      return;
    }
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as (string | number | null)[][];

        const importedShifts: Shift[] = [];
        const importedLeave: Leave[] = [];
        
        let month = new Date().getMonth();
        let year = new Date().getFullYear();

        const monthRow = json.find(row => row.some(cell => typeof cell === 'string' && /august/i.test(cell)));
        if (monthRow) {
            const monthCell = monthRow.find(cell => typeof cell === 'string' && /august/i.test(cell));
            if (monthCell) {
                 // Simple month detection for now. Can be improved.
                 if (/august/i.test(monthCell)) month = 7;
            }
        }

        let dateRowIndex = -1;
        const dateRow = json.find((row, index) => {
            const isDateRow = row.some(cell => typeof cell === 'number' && cell >= 1 && cell <= 31);
            if(isDateRow) {
                dateRowIndex = index;
                return true;
            }
            return false;
        });

        if (!dateRow) {
            throw new Error("Could not find the date row (1-31) in the Excel sheet.");
        }
        
        const dateMap: { [key: number]: number } = {};
        dateRow.forEach((cell, index) => {
            if (typeof cell === 'number' && cell >= 1 && cell <= 31) {
                dateMap[index] = cell;
            }
        });


        json.forEach((row, rowIndex) => {
            // Process rows after the date row that have a string in the first column
            if (rowIndex <= dateRowIndex || !row[0] || typeof row[0] !== 'string') return;
            
            const employee = findEmployeeByName(row[0]);
            if (!employee) return;
            
            Object.entries(dateMap).forEach(([colIndexStr, day]) => {
                const colIndex = parseInt(colIndexStr);
                const cellValue = row[colIndex];
                if (cellValue === null || cellValue === undefined || cellValue === 'OFF' || cellValue === '') return;

                const date = new Date(year, month, day);
                const cellString = String(cellValue);

                const timeMatch = cellString.match(/(\d{1,2}(?::\d{2})?(?:am|pm))-(\d{1,2}(?::\d{2})?(?:am|pm))/i);
                
                if (timeMatch) {
                    const convertTo24Hour = (time: string) => {
                        time = time.toLowerCase();
                        let [h, m] = time.replace('am', '').replace('pm', '').split(':');
                        let hour = parseInt(h);
                        
                        if (time.includes('pm') && hour !== 12) {
                            hour += 12;
                        }
                        if (time.includes('am') && hour === 12) {
                           hour = 0;
                        }
                        return `${String(hour).padStart(2, '0')}:${m || '00'}`;
                    }
                    
                    importedShifts.push({
                        id: `imp-sh-${rowIndex}-${colIndex}`,
                        employeeId: employee.id,
                        date,
                        startTime: convertTo24Hour(timeMatch[1]),
                        endTime: convertTo24Hour(timeMatch[2]),
                        label: 'Imported Shift'
                    });

                } else if (['VL', 'SL', 'AVL', 'HOL-OFF'].includes(cellString.toUpperCase())) {
                     importedLeave.push({
                        id: `imp-lv-${rowIndex}-${colIndex}`,
                        employeeId: employee.id,
                        date,
                        type: cellString.toUpperCase() === 'HOL-OFF' ? 'Unavailable' : 'Vacation',
                        isAllDay: true,
                     })
                }
            });
        });

        if (importedShifts.length === 0 && importedLeave.length === 0) {
             toast({ title: 'Import Warning', description: `No shifts or leave were found in the file. Please check the file format.`, variant: 'destructive' });
        } else {
            onImport(importedShifts, importedLeave);
            toast({ title: 'Import Successful', description: `${importedShifts.length} shifts and ${importedLeave.length} leave entries imported.` });
            setIsOpen(false);
        }

      } catch (error) {
        console.error("Import failed:", error);
        toast({ title: 'Import Failed', description: (error as Error).message || 'There was an error processing the file.', variant: 'destructive' });
      } finally {
        setIsImporting(false);
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Schedule from Excel</DialogTitle>
          <DialogDescription>
            Upload an XLSX file to import shifts and leave. The file should have employee names in the first column and dates in a header row.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Label htmlFor="schedule-file">Excel File (.xlsx)</Label>
            <Input id="schedule-file" type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
