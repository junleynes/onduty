
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
  return name.trim().toLowerCase().replace(/[^a-z]/g, '');
};

const findEmployeeByName = (name: string) => {
  const normalizedInput = normalizeName(name);
  return employees.find(emp => {
    const fullName = `${emp.lastName}, ${emp.firstName} ${emp.middleInitial || ''}`;
    const normalizedFullName = normalizeName(fullName);
    return normalizedFullName === normalizedInput;
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
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const importedShifts: Shift[] = [];
        const importedLeave: Leave[] = [];
        
        const monthYearMatch = Object.keys(worksheet).find(key => worksheet[key]?.v === 'August');
        const month = monthYearMatch ? 7 : new Date().getMonth(); // August is 7 (0-indexed)
        const year = 2024; // Hardcoded for now based on image, can be improved

        const dateRow = json.find(row => row.some(cell => typeof cell === 'number' && cell >= 1 && cell <= 31)) || [];
        const dateMap: { [key: number]: number } = {};
        dateRow.forEach((cell, index) => {
            if (typeof cell === 'number' && cell >= 1 && cell <= 31) {
                dateMap[index] = cell;
            }
        })


        json.forEach((row, rowIndex) => {
            if (rowIndex < 2 || !row[0] || typeof row[0] !== 'string' || row[0].toLowerCase().includes('post production')) return;
            
            const employee = findEmployeeByName(row[0]);
            if (!employee) return;
            
            Object.entries(dateMap).forEach(([colIndex, day]) => {
                const cellValue = row[parseInt(colIndex)];
                if (!cellValue || cellValue === 'OFF') return;

                const date = new Date(year, month, day);

                if (typeof cellValue === 'string') {
                    const timeMatch = cellValue.match(/(\d{1,2}(?:am|pm))-(\d{1,2}(?:am|pm))/i);
                    if (timeMatch) {
                        const convertTo24Hour = (time: string) => {
                            let [h, m] = [time.slice(0, -2), '00'];
                            if (time.toLowerCase().includes('pm') && h !== '12') {
                                h = (parseInt(h) + 12).toString();
                            }
                            if (time.toLowerCase().includes('am') && h === '12') {
                                h = '00';
                            }
                            return `${h.padStart(2, '0')}:${m}`;
                        }
                        
                        importedShifts.push({
                            id: `imp-sh-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            startTime: convertTo24Hour(timeMatch[1]),
                            endTime: convertTo24Hour(timeMatch[2]),
                            label: 'Imported Shift'
                        });

                    } else if (['VL', 'SL', 'AVL', 'HOL-OFF'].includes(cellValue)) {
                         importedLeave.push({
                            id: `imp-lv-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            type: cellValue === 'HOL-OFF' ? 'Unavailable' : 'Vacation',
                            isAllDay: true,
                         })
                    }
                }
            })
        });

        onImport(importedShifts, importedLeave);
        toast({ title: 'Import Successful', description: `${importedShifts.length} shifts and ${importedLeave.length} leave entries imported.` });
        setIsOpen(false);
      } catch (error) {
        console.error("Import failed:", error);
        toast({ title: 'Import Failed', description: 'There was an error processing the file.', variant: 'destructive' });
      } finally {
        setIsImporting(false);
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
            Upload an XLSX file to import shifts and leave. The file should have employee names in the first column and dates in the first row.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Label htmlFor="schedule-file">Excel File (.xlsx)</Label>
            <Input id="schedule-file" type="file" onChange={handleFileChange} accept=".xlsx" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
