
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
import type { Shift, Leave, Employee } from '@/types';
import type { ShiftTemplate } from './shift-editor';

type ScheduleImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (importedShifts: Shift[], importedLeave: Leave[], employeeOrder: string[]) => void;
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
};

const normalizeName = (name: string): string => {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
};

const findEmployeeByName = (name: string, allEmployees: Employee[]): Employee | null => {
  if (!name || typeof name !== 'string') return null;

  const normalizedInput = normalizeName(name);

  // Exact match first
  for (const emp of allEmployees) {
    const fullName = normalizeName(`${emp.firstName} ${emp.lastName}`);
    const fullNameWithMI = normalizeName(`${emp.firstName} ${emp.middleInitial || ''} ${emp.lastName}`);
    if (fullName === normalizedInput || fullNameWithMI === normalizedInput) {
      return emp;
    }
  }

  // Handle "Lastname, Firstname M.I. Suffix"
  if (name.includes(',')) {
    const parts = name.split(',').map(p => p.trim());
    const lastNamePart = normalizeName(parts[0]);
    const firstNamePart = normalizeName(parts[1] || '');

    for (const emp of allEmployees) {
      const normalizedEmpLastName = normalizeName(emp.lastName);
      const normalizedEmpFirstName = normalizeName(emp.firstName);
      if (normalizedEmpLastName === lastNamePart && firstNamePart.startsWith(normalizedEmpFirstName)) {
        return emp;
      }
    }
  }

  return null;
};

const convertTo24Hour = (time: string): string => {
    let tempTime = time.toLowerCase().replace(/\s/g, '');
    const isPm = tempTime.includes('pm') || tempTime.includes('p');
    const isAm = tempTime.includes('am') || tempTime.includes('a');
    
    tempTime = tempTime.replace('pm', '').replace('p', '').replace('am', '').replace('a', '');
    
    let [h, m] = tempTime.split(':');
    if (!m) m = '00';
    let hour = parseInt(h, 10);

    if (isNaN(hour)) return '';

    if (isPm && hour < 12) {
        hour += 12;
    }
    if (isAm && hour === 12) { // Midnight case: 12am is 00:00
        hour = 0;
    }
    
    return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function ScheduleImporter({ isOpen, setIsOpen, onImport, employees, shiftTemplates }: ScheduleImporterProps) {
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
      header: false,
      skipEmptyLines: false, // Keep empty lines to detect blocks
      complete: (results) => {
        try {
          const rows = results.data as string[][];
          const importedShifts: Shift[] = [];
          const importedLeave: Leave[] = [];
          const employeeOrder: string[] = [];
          
          const scheduleBlocks: string[][][] = [];
          let currentBlock: string[][] = [];

          for (const row of rows) {
              const isRowEmpty = row.every(cell => cell === null || cell.trim() === '');
              if (isRowEmpty) {
                  if (currentBlock.length > 0) {
                      scheduleBlocks.push(currentBlock);
                      currentBlock = [];
                  }
              } else {
                  currentBlock.push(row);
              }
          }
          if (currentBlock.length > 0) {
              scheduleBlocks.push(currentBlock);
          }
          
          if (scheduleBlocks.length === 0) {
              throw new Error("Could not find any schedule blocks in the file.");
          }

          scheduleBlocks.forEach((block, blockIndex) => {
              const headerRow = block[0];
              if (!headerRow || !headerRow[0] || headerRow[0].trim().toLowerCase() !== 'employees') {
                  console.warn(`Block ${blockIndex + 1} is missing a valid header row. Skipping.`);
                  return;
              }

              const dates: { colIndex: number, date: Date }[] = [];
              for(let i = 1; i < headerRow.length; i++) {
                  const dateStr = headerRow[i]?.trim();
                  if (dateStr) {
                      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                          const date = new Date(`${dateStr}T00:00:00Z`); // Use UTC to avoid timezone issues
                          if (!isNaN(date.getTime())) {
                              dates.push({ colIndex: i, date });
                          }
                      }
                  }
              }

              if (dates.length === 0) {
                  console.warn(`No valid dates found in header of block ${blockIndex + 1}. Skipping.`);
                  return;
              }

              for (let rowIndex = 1; rowIndex < block.length; rowIndex++) {
                  const employeeRow = block[rowIndex];
                  const employeeName = employeeRow[0];
                  if (!employeeName) continue;

                  const employee = findEmployeeByName(employeeName, employees);
                  if (!employee) {
                      console.warn(`Employee "${employeeName}" not found. Skipping row.`);
                      continue;
                  }

                  if (!employeeOrder.includes(employee.id)) {
                      employeeOrder.push(employee.id);
                  }

                  dates.forEach(({ colIndex, date }) => {
                      const cellValue = employeeRow[colIndex]?.trim().toUpperCase();
                      if (!cellValue) return;

                      if (cellValue === 'OFF') {
                          importedShifts.push({ id: `imp-sh-${blockIndex}-${rowIndex}-${colIndex}`, employeeId: employee.id, date, startTime: '', endTime: '', label: 'OFF', color: 'transparent', isDayOff: true });
                          return;
                      }
                      if (cellValue === 'HOL-OFF') {
                          importedShifts.push({ id: `imp-sh-${blockIndex}-${rowIndex}-${colIndex}`, employeeId: employee.id, date, startTime: '', endTime: '', label: 'HOL-OFF', color: 'transparent', isHolidayOff: true });
                          return;
                      }

                      if (['VL', 'EL', 'SL', 'BL', 'PL', 'ML', 'OFFSET', 'AVL'].includes(cellValue)) {
                          importedLeave.push({ id: `imp-lv-${blockIndex}-${rowIndex}-${colIndex}`, employeeId: employee.id, date, type: cellValue, isAllDay: true });
                          return;
                      }
                      
                      const timeMatch = cellValue.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)/i);
                      if (timeMatch) {
                          const startTime = convertTo24Hour(timeMatch[1]);
                          const endTime = convertTo24Hour(timeMatch[2]);
                          if (!startTime || !endTime) return;
                          
                          const matchedTemplate = shiftTemplates.find(t => t.startTime === startTime && t.endTime === endTime);
                          importedShifts.push({
                              id: `imp-sh-${blockIndex}-${rowIndex}-${colIndex}`,
                              employeeId: employee.id,
                              date,
                              startTime,
                              endTime,
                              label: matchedTemplate ? matchedTemplate.label : 'Shift',
                              color: matchedTemplate ? matchedTemplate.color : '#9b59b6'
                          });
                      }
                  });
              }
          });

          if (importedShifts.length === 0 && importedLeave.length === 0) {
            throw new Error("No shifts or leave could be parsed from the file. Please check the file format, especially employee names and date headers.");
          }

          onImport(importedShifts, importedLeave, employeeOrder);
          toast({ title: 'Import Successful', description: `${importedShifts.length} shifts and ${importedLeave.length} leave entries imported.` });
          setIsOpen(false);

        } catch (error: any) {
          console.error("Import failed:", error);
          toast({ title: 'Import Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive', duration: 8000 });
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
          <DialogTitle>Import Schedule from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file. The file should have a header row starting with "Employees" followed by dates in yyyy-mm-dd format.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="schedule-file">CSV File</Label>
          <Input id="schedule-file" type="file" onChange={handleFileChange} accept=".csv" />
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
