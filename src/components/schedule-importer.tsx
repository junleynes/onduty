
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
import type { Shift, Leave, Employee } from '@/types';
import { employees } from '@/lib/data';

type ScheduleImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (importedShifts: Shift[], importedLeave: Leave[]) => void;
};

const normalizeName = (name: string) => {
  if (!name) return '';
  // Convert to lowercase, remove all non-alphanumeric chars except comma, then remove extra spaces
  return name.trim().toLowerCase().replace(/[^a-z0-9, ]/g, '').replace(/\s+/g, ' ');
};

const findEmployeeByName = (name: string, allEmployees: Employee[]) => {
    if (!name) return null;
    const normalizedInput = normalizeName(name);
    return allEmployees.find(emp => {
        // Match against "lastname, firstname m" or "firstname lastname"
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

        const monthRow = json.find(row => row.some(cell => typeof cell === 'string' && /(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(String(cell))));
        if (monthRow) {
            const monthCell = monthRow.find(cell => typeof cell === 'string' && /(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(String(cell)));
            if (monthCell) {
                 const monthString = String(monthCell);
                 const monthStr = monthString.toLowerCase();
                 if (monthStr.includes('january')) month = 0;
                 if (monthStr.includes('february')) month = 1;
                 if (monthStr.includes('march')) month = 2;
                 if (monthStr.includes('april')) month = 3;
                 if (monthStr.includes('may')) month = 4;
                 if (monthStr.includes('june')) month = 5;
                 if (monthStr.includes('july')) month = 6;
                 if (monthStr.includes('august')) month = 7;
                 if (monthStr.includes('september')) month = 8;
                 if (monthStr.includes('october')) month = 9;
                 if (monthStr.includes('november')) month = 10;
                 if (monthStr.includes('december')) month = 11;
                 
                 const yearMatch = monthString.match(/\b(20\d{2})\b/);
                 if (yearMatch) {
                    year = parseInt(yearMatch[0], 10);
                 }
            }
        }

        const isDateRow = (row: (string | number | null)[]): boolean => {
            const dateLikeCells = row.filter(cell => {
                if (cell === null || cell === undefined) return false;
                const cellStr = String(cell).trim();
                if (cellStr === '') return false;
                const num = Number(cellStr);
                return !isNaN(num) && num >= 1 && num <= 31;
            });
            return dateLikeCells.length > 5;
        };

        const dateRowIndices = json.reduce((acc, row, index) => {
            if (isDateRow(row)) {
                acc.push(index);
            }
            return acc;
        }, [] as number[]);


        if (dateRowIndices.length === 0) {
            throw new Error("Could not find any date rows (e.g., 1-31) in the Excel sheet. Please ensure the dates are present and formatted as numbers or text.");
        }
        
        dateRowIndices.forEach((dateRowIndex, i) => {
            const dateRow = json[dateRowIndex];
            const dateMap: { [key: number]: number } = {};
            dateRow.forEach((cell, index) => {
                if (cell === null || cell === undefined) return;
                const day = Number(String(cell).trim());
                if (!isNaN(day) && day >= 1 && day <= 31) {
                    dateMap[index] = day;
                }
            });

            const startRow = dateRowIndex + 1;
            const endRow = i < dateRowIndices.length - 1 ? dateRowIndices[i+1] : json.length;

            for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
                const row = json[rowIndex];
                if (!row || !row[0] || typeof row[0] !== 'string') continue;
                
                const employee = findEmployeeByName(row[0], employees);
                if (!employee) {
                    console.warn(`Could not find employee for name: ${row[0]}`);
                    continue;
                };
                
                Object.entries(dateMap).forEach(([colIndexStr, day]) => {
                    const colIndex = parseInt(colIndexStr);
                    const cellValue = row[colIndex];
                    if (cellValue === null || cellValue === undefined || String(cellValue).toUpperCase() === 'OFF' || String(cellValue).trim() === '') return;

                    const date = new Date(year, month, day);
                    const cellString = String(cellValue);
                    
                    const timeMatch = cellString.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
                    
                    if (timeMatch) {
                        const convertTo24Hour = (time: string) => {
                            let tempTime = time.toLowerCase().replace(/\s/g, '');
                            let [h, m] = tempTime.replace('am', '').replace('pm', '').split(':');
                            let hour = parseInt(h);
                            
                            if (tempTime.includes('pm') && hour < 12) {
                                hour += 12;
                            }
                            if (tempTime.includes('am') && hour === 12) { // Midnight case
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

                    } else if (['VL', 'SL', 'AVL', 'HOL-OFF', 'OFFSET'].includes(cellString.toUpperCase().trim())) {
                         importedLeave.push({
                            id: `imp-lv-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            type: ['HOL-OFF', 'OFFSET'].includes(cellString.toUpperCase().trim()) ? 'Unavailable' : 'Vacation',
                            isAllDay: true,
                         })
                    }
                });
            }
        });
        

        if (importedShifts.length === 0 && importedLeave.length === 0) {
             toast({ title: 'Import Warning', description: `No shifts or leave were found in the file. Please check that the file format is correct and that employee names in the file match names in the Team Members list.`, variant: 'destructive', duration: 8000 });
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
