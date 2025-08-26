
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
  // Convert to lowercase and remove extra spaces, but keep commas and periods for parsing.
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
};


const findEmployeeByName = (name: string, allEmployees: Employee[]) => {
    if (!name) return null;
    const normalizedInput = normalizeName(name);

    return allEmployees.find(emp => {
        const fullName = normalizeName(`${emp.firstName} ${emp.lastName}`);
        if (fullName === normalizedInput) return true;

        // Handle "Lastname, Firstname" and "Lastname, Firstname M.I."
        const excelParts = normalizedInput.split(',').map(p => p.trim());
        if (excelParts.length === 2) {
            const excelLastName = excelParts[0];
            const excelFirstNameAndRest = excelParts[1];
            
            // Construct the full name from employee data for comparison
            // e.g., 'Rodrigo' + ' ' + 'Leynes Jr' -> 'rodrigo leynes jr'
            const empFirstName = normalizeName(emp.firstName);
            const empLastName = normalizeName(emp.lastName);
            
            // e.g., 'leynez jr' -> ['leynes', 'jr'] -> 'leynes'
            const empPrimaryLastName = empLastName.split(' ')[0];

            // For "LEYNES, RODRIGO JR E"
            // excelLastName = "leynes"
            // excelFirstNameAndRest = "rodrigo jr e"
            if (excelLastName === empPrimaryLastName) {
                // Now check if "rodrigo jr e" matches "rodrigo leynes jr e"
                // Construct the "rest" of the name from our employee data
                const empFirstNameAndRest = normalizeName(`${emp.firstName} ${emp.lastName.substring(empPrimaryLastName.length).trim()} ${emp.middleInitial || ''}`.trim());
                if (excelFirstNameAndRest === empFirstNameAndRest) {
                    return true;
                }
            }
        }
        
        // Fallback for simple "Lastname, Firstname"
        const lastNameFirst = normalizeName(`${emp.lastName}, ${emp.firstName}`);
        if (normalizedInput.startsWith(lastNameFirst)) return true;
        
        return false;
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
                    console.warn(`Could not find employee for name: ${row[0]}`);
                    continue;
                };
                
                Object.entries(dateMap).forEach(([colIndexStr, day]) => {
                    const colIndex = parseInt(colIndexStr);
                    const cellValue = row[colIndex];
                    if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') return;

                    const date = new Date(Date.UTC(year, month, day));
                    const cellString = String(cellValue);
                    
                    if (cellString.toUpperCase().trim() === 'OFF') {
                        importedShifts.push({
                            id: `imp-sh-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            startTime: '',
                            endTime: '',
                            label: 'Day Off',
                            color: 'transparent',
                            isDayOff: true,
                        });
                        return;
                    }
                    
                    const timeMatch = cellString.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
                    
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
                        
                        importedShifts.push({
                            id: `imp-sh-${rowIndex}-${colIndex}`,
                            employeeId: employee.id,
                            date,
                            startTime: convertTo24Hour(timeMatch[1]),
                            endTime: convertTo24Hour(timeMatch[2]),
                            label: employee.position || 'Imported Shift',
                            color: '#3498db' // Default color
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
        
        const matchedEmployeeNames = new Set(importedShifts.map(s => getEmployeeById(s.employeeId)?.firstName).filter(Boolean));
        
        if (importedShifts.length === 0 && importedLeave.length === 0) {
             const employeeNamesInFile = new Set(json.map(row => row[0]).filter(name => typeof name === 'string' && name.trim() !== ''));
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

  const getEmployeeById = (id: string | null) => {
    if (!id) return null;
    return employees.find(e => e.id === id);
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
