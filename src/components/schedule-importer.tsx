
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
import type { ShiftTemplate } from './shift-editor';


type ScheduleImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (importedShifts: Shift[], importedLeave: Leave[]) => void;
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
};

const normalizeName = (name: string) => {
  if (!name) return '';
  // Keep periods for suffixes like Jr. but normalize whitespace and remove commas
  return name.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
};


const findEmployeeByName = (name: string, allEmployees: Employee[]) => {
    if (!name || typeof name !== 'string') return null;

    const normalizedInput = normalizeName(name);

    for (const emp of allEmployees) {
        const normalizedEmpFirstName = normalizeName(emp.firstName);
        const normalizedEmpLastName = normalizeName(emp.lastName);
        // Full name with and without middle initial
        const normalizedEmpFullName = normalizeName(`${emp.firstName} ${emp.lastName}`);
        const normalizedEmpFullNameWithMI = normalizeName(`${emp.firstName} ${emp.middleInitial || ''} ${emp.lastName}`);
        
        // Direct full name match
        if (normalizedEmpFullName === normalizedInput || normalizedEmpFullNameWithMI === normalizedInput) {
            return emp;
        }

        // Handle "Lastname, Firstname M.I. Suffix" format
        if (name.includes(',')) {
            const parts = name.split(',').map(p => p.trim());
            const lastNamePart = normalizeName(parts[0]);
            const restOfNamePart = normalizeName(parts.slice(1).join(' '));
            
            if (normalizedEmpLastName === lastNamePart) {
                const empFirstNameAndRest = normalizeName(`${emp.firstName} ${emp.middleInitial || ''}`).trim();
                const empFirstNameOnly = normalizeName(emp.firstName).trim();

                // It should match the rest of the name
                if (restOfNamePart.startsWith(empFirstNameOnly)) {
                     return emp;
                }
            }
        }
    }
    
    // Fallback for "Firstname Lastname" or "Firstname M Lastname" if all else fails
    const parts = normalizedInput.split(' ');
    const firstNamePart = parts[0];
    const lastNamePart = parts[parts.length -1];
     for (const emp of allEmployees) {
         if (normalizeName(emp.firstName) === firstNamePart && normalizeName(emp.lastName) === lastNamePart) {
            return emp;
        }
    }

    return null;
};


export function ScheduleImporter({ isOpen, setIsOpen, onImport, employees, shiftTemplates }: ScheduleImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const getEmployeeById = (id: string | null) => {
    if (!id) return null;
    return employees.find(e => e.id === id);
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
                 const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                 const monthIndex = months.findIndex(m => monthStr.includes(m));
                 if (monthIndex > -1) {
                    month = monthIndex;
                 }
                 
                 const yearMatch = monthString.match(/\b(20\d{2})\b/);
                 if (yearMatch) {
                    year = parseInt(yearMatch[0], 10);
                 }
            }
        }

        const isDateRow = (row: (string | number | null)[]): boolean => {
            if (!row || row.length === 0) return false;
            const dateLikeCells = row.filter(cell => {
                if (cell === null || cell === undefined) return false;
                const cellStr = String(cell).trim();
                if (cellStr === '') return false;
                // Check if it's a number between 1 and 31
                if (!/^\d{1,2}$/.test(cellStr)) return false;
                const num = Number(cellStr);
                return !isNaN(num) && num >= 1 && num <= 31;
            });
            // A row is considered a date row if it has more than 5 numbers between 1 and 31.
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
                const dayStr = String(cell).trim();
                if (/^\d{1,2}$/.test(dayStr)) {
                    const day = Number(dayStr);
                     if (!isNaN(day) && day >= 1 && day <= 31) {
                        dateMap[index] = day;
                    }
                }
            });

            const startRow = dateRowIndex + 1;
            const endRow = i < dateRowIndices.length - 1 ? dateRowIndices[i+1] : json.length;

            for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
                const row = json[rowIndex];
                if (!row || !row[0] || typeof row[0] !== 'string') continue;
                
                const employee = findEmployeeByName(row[0] as string, employees);
                if (!employee) {
                    continue;
                };
                
                Object.entries(dateMap).forEach(([colIndexStr, day]) => {
                    const colIndex = parseInt(colIndexStr);
                    const cellValue = row[colIndex];
                    if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') return;

                    const date = new Date(Date.UTC(year, month, day));
                    const cellString = String(cellValue).toUpperCase().trim();
                    
                    if (cellString === 'OFF') {
                        importedShifts.push({
                            id: `imp-sh-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            startTime: '',
                            endTime: '',
                            label: 'OFF',
                            color: 'transparent',
                            isDayOff: true,
                        });
                        return;
                    }
                     if (cellString === 'HOL-OFF') {
                        importedShifts.push({
                            id: `imp-sh-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            startTime: '',
                            endTime: '',
                            label: 'HOL-OFF',
                            color: 'transparent',
                            isHolidayOff: true,
                        });
                        return;
                    }
                    
                    const timeMatch = cellString.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
                    
                    if (timeMatch) {
                        const convertTo24Hour = (time: string) => {
                            let tempTime = time.toLowerCase().replace(/\s/g, '');
                            let [h, m] = tempTime.replace('am', '').replace('pm', '').split(':');
                            let hour = parseInt(h);
                            
                            if (tempTime.includes('pm') && hour < 12) {
                                hour += 12;
                            }
                            if (tempTime.includes('am') && hour === 12) { // Midnight case: 12am is 00:00
                               hour = 0;
                            }
                            return `${String(hour).padStart(2, '0')}:${m || '00'}`;
                        }

                        const startTime = convertTo24Hour(timeMatch[1]);
                        const endTime = convertTo24Hour(timeMatch[2]);
                        
                        const matchedTemplate = shiftTemplates.find(t => t.startTime === startTime && t.endTime === endTime);

                        importedShifts.push({
                            id: `imp-sh-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            startTime,
                            endTime,
                            label: matchedTemplate ? matchedTemplate.label : 'Unknown Shift',
                            color: matchedTemplate ? matchedTemplate.color : '#9b59b6' // purple for unknown
                        });

                    } else if (['VL', 'EL', 'SL', 'BL', 'PL', 'ML', 'OFFSET', 'AVL'].includes(cellString)) {
                         importedLeave.push({
                            id: `imp-lv-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            type: cellString === 'AVL' ? 'VL' : cellString,
                            isAllDay: true,
                         })
                    }
                });
            }
        });
        
        const matchedEmployeeNames = new Set(importedShifts.map(s => getEmployeeById(s.employeeId)?.firstName).filter(Boolean));
        
        if (importedShifts.length === 0 && importedLeave.length === 0) {
             const employeeNamesInFile = new Set(json.map(row => row[0]).filter(name => typeof name === 'string' && name.trim() !== '' && !isDateRow(row as any) && name.toLowerCase() !== 'employee'));
             const unmatchedNames = [...employeeNamesInFile].filter(name => !findEmployeeByName(name as string, employees));

             let errorDetail = 'Please check that the file format is correct.';
             if (unmatchedNames.length > 0) {
                 errorDetail = `No employees from the Excel file could be matched to team members. Unmatched names include: ${unmatchedNames.slice(0, 3).join(', ')}...`
             } else if(dateRowIndices.length === 0) {
                 errorDetail = "Could not find the date row (1-31). Please ensure it exists and contains numbers."
             }

             toast({ title: 'Import Warning', description: `No shifts or leave were found. ${errorDetail}`, variant: 'destructive', duration: 8000 });
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
