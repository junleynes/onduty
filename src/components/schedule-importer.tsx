

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
import type { LeaveTypeOption } from './leave-type-editor';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { findEmployeeByName } from '@/lib/utils';


type ScheduleImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (importedData: {
    shifts: Shift[],
    leave: Leave[],
    employeeOrder: string[],
    overwrittenCells: { employeeId: string, date: Date }[],
    monthKey: string,
  }) => void;
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  leaveTypes: LeaveTypeOption[];
};

const convertTo24Hour = (timeStr: string): string => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    let time = timeStr.trim().toLowerCase();
    
    // Check for am/pm
    const isPm = time.includes('pm') || time.includes('p');
    const isAm = time.includes('am') || time.includes('a');
    
    // Remove am/pm for easier parsing
    time = time.replace(/am|pm|a|p/g, '').trim();
    
    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours)) hours = 0;
    if (isNaN(minutes)) minutes = 0;

    if (isPm && hours < 12) {
        hours += 12;
    }
    if (isAm && hours === 12) { // Handle 12am (midnight)
        hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export function ScheduleImporter({ isOpen, setIsOpen, onImport, employees, shiftTemplates, leaveTypes }: ScheduleImporterProps) {
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
          const overwrittenCells: { employeeId: string, date: Date }[] = [];
          let monthKey = '';
          
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
              toast({ title: 'Import Warning', description: 'Could not find any schedule blocks in the file.', variant: 'destructive', duration: 8000 });
              setIsImporting(false);
              return;
          }
          
          const validLeaveTypes = new Set(leaveTypes.map(lt => lt.type.toUpperCase()));

          scheduleBlocks.forEach((block, blockIndex) => {
              const headerRow = block[0];
              if (!headerRow || !headerRow[0] || !headerRow[0].trim().toLowerCase().includes('employee')) {
                  console.warn(`Block ${blockIndex + 1} is missing a valid header row. Skipping.`);
                  return;
              }

              const dates: { colIndex: number, date: Date }[] = [];
              for(let i = 1; i < headerRow.length; i++) {
                  const dateStr = headerRow[i]?.trim();
                  if (dateStr) {
                      // Use UTC to avoid timezone issues, especially for YYYY-MM-DD
                      const date = new Date(dateStr + 'T00:00:00Z');
                      if (!isNaN(date.getTime())) {
                          dates.push({ colIndex: i, date });
                      }
                  }
              }

              if (dates.length === 0) {
                  console.warn(`No valid dates found in header of block ${blockIndex + 1}. Skipping.`);
                  return;
              }

              // Determine the month key from the first valid date in the import
              if (!monthKey && dates.length > 0) {
                  monthKey = format(dates[0].date, 'yyyy-MM');
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
                      const cellValue = employeeRow[colIndex]?.trim();
                      if (!cellValue) {
                          // Still mark this cell for overwrite, even if it's empty
                          overwrittenCells.push({ employeeId: employee.id, date });
                          return;
                      };

                      overwrittenCells.push({ employeeId: employee.id, date });

                      const upperCellValue = cellValue.toUpperCase();

                      if (upperCellValue === 'OFF') {
                          importedShifts.push({ id: uuidv4(), employeeId: employee.id, date, startTime: '', endTime: '', label: 'OFF', color: 'transparent', isDayOff: true, status: 'draft' });
                          return;
                      }
                      if (upperCellValue === 'HOL-OFF') {
                          importedShifts.push({ id: uuidv4(), employeeId: employee.id, date, startTime: '', endTime: '', label: 'HOL-OFF', color: 'transparent', isHolidayOff: true, status: 'draft' });
                          return;
                      }

                      // Handle partial-day leave first, e.g., "1pm-5pm / VL"
                      if (cellValue.includes('/')) {
                        const parts = cellValue.split('/').map(p => p.trim());
                        const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)/i;
                        const timeMatch = parts[0].match(timeRegex);
                        const leaveType = parts[1]?.toUpperCase();

                        if (timeMatch && leaveType && validLeaveTypes.has(leaveType)) {
                            const startTime = convertTo24Hour(timeMatch[1]);
                            const endTime = convertTo24Hour(timeMatch[2]);
                            const leaveTypeDetails = leaveTypes.find(lt => lt.type.toUpperCase() === leaveType);
                            if (startTime && endTime) {
                                importedLeave.push({
                                    id: uuidv4(),
                                    employeeId: employee.id,
                                    startDate: date,
                                    endDate: date,
                                    type: leaveType,
                                    isAllDay: false,
                                    startTime,
                                    endTime,
                                    status: 'approved',
                                    color: leaveTypeDetails?.color
                                } as Leave);
                                return;
                            }
                        }
                      }
                      
                      // Handle full-day leave, e.g., "VL"
                      if (validLeaveTypes.has(upperCellValue)) {
                          const leaveTypeDetails = leaveTypes.find(lt => lt.type.toUpperCase() === upperCellValue);
                          importedLeave.push({ 
                              id: uuidv4(), 
                              employeeId: employee.id, 
                              startDate: date,
                              endDate: date,
                              type: leaveTypeDetails!.type, 
                              isAllDay: true, 
                              status: 'approved',
                              color: leaveTypeDetails?.color
                          } as Leave);
                          return;
                      }
                      
                      const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)/i;
                      const timeMatch = cellValue.match(timeRegex);

                      if (timeMatch) {
                          const startTime = convertTo24Hour(timeMatch[1]);
                          const endTime = convertTo24Hour(timeMatch[2]);
                          if (!startTime || !endTime) return;
                          
                          const matchedTemplate = shiftTemplates.find(t => t.startTime === startTime && t.endTime === endTime);
                          importedShifts.push({
                              id: uuidv4(),
                              employeeId: employee.id,
                              date,
                              startTime,
                              endTime,
                              label: matchedTemplate ? matchedTemplate.label : 'Shift',
                              color: matchedTemplate ? matchedTemplate.color : '#9b59b6',
                              status: 'draft',
                              breakStartTime: matchedTemplate?.breakStartTime,
                              breakEndTime: matchedTemplate?.breakEndTime,
                              isUnpaidBreak: matchedTemplate?.isUnpaidBreak,
                          });
                      }
                  });
              }
          });

          if (importedShifts.length === 0 && importedLeave.length === 0) {
            toast({ title: 'Import Warning', description: 'No valid shifts or leave could be parsed. Please check employee names, date headers (yyyy-mm-dd), and shift formats (e.g., 9am-5pm).', variant: 'destructive', duration: 10000 });
            setIsImporting(false);
            setFile(null);
            return;
          }

          onImport({ shifts: importedShifts, leave: importedLeave, employeeOrder, overwrittenCells, monthKey });
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
            Upload a CSV file. The file should have a header row starting with "Employees" followed by dates in yyyy-mm-dd format. Existing entries for the same date and employee will be overwritten.
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
