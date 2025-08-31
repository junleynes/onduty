
'use client';

import React, { useState } from 'react';
import type { Employee, Shift, Leave } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Download, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn, getFullName, getInitialState } from '@/lib/utils';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { ReportTemplateUploader } from './report-template-uploader';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';

type ReportsViewProps = {
    employees: Employee[];
    shifts: Shift[];
    leave: Leave[];
    currentUser: Employee;
}

export default function ReportsView({ employees, shifts, leave, currentUser }: ReportsViewProps) {
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const [template, setTemplate] = useState<string | null>(() => getInitialState('workScheduleTemplate', null));

    const handleDownloadReport = async () => {
        if (!template) {
            toast({ variant: 'destructive', title: 'No Template', description: 'Please upload a work schedule template first.' });
            return;
        }
        if (!dateRange || !dateRange.from || !dateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a covered period for the report.' });
            return;
        }
        
        try {
            const groupEmployees = employees.filter(e => e.group === currentUser.group);
            const workbook = new ExcelJS.Workbook();
            const buffer = Buffer.from(template, 'binary');
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new Error("Template worksheet not found.");
            
            const daysInInterval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

            // Find and replace global placeholders
            worksheet.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    if (cell.value && typeof cell.value === 'string') {
                        let cellText = cell.value;
                        if (cellText.includes('{{start_date}}')) {
                            cell.value = cellText.replace('{{start_date}}', format(dateRange.from!, 'MM/dd/yyyy'));
                        }
                        if (cellText.includes('{{end_date}}')) {
                            cell.value = cellText.replace('{{end_date}}', format(dateRange.to!, 'MM/dd/yyyy'));
                        }
                    }
                });
            });

            // Find rows with employee placeholders to use as templates
            const employeeRowTemplates: { [key: string]: { row: ExcelJS.Row, index: number } } = {};
            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    if (typeof cell.value === 'string' && cell.value.includes('{{employee_name}}')) {
                       // Store a copy of the template row, not the live one
                       const newRow = worksheet.addRow(row.values as any[]);
                       newRow.commit();
                       const templateRow = worksheet.getRow(worksheet.rowCount);
                       worksheet.removeRow(worksheet.rowCount);
                       
                       employeeRowTemplates[rowNumber] = { row: templateRow, index: rowNumber };
                       row.hidden = true; // Hide the original template row
                    }
                });
            });
            
             if (Object.keys(employeeRowTemplates).length === 0) {
                throw new Error("No `{{employee_name}}` placeholder found in the template.");
            }
            
            let lastRow = worksheet.rowCount;
            groupEmployees.forEach((employee) => {
                 for (const key in employeeRowTemplates) {
                    const { row: templateRow } = employeeRowTemplates[key];
                    const newRow = worksheet.addRow(templateRow.values as any[]);

                    newRow.eachCell({ includeEmpty: true }, (cell) => {
                         if (typeof cell.value === 'string') {
                            let text = cell.value;
                            if (text.includes('{{employee_name}}')) text = text.replace('{{employee_name}}', getFullName(employee));

                            const dayData = findDataForDay(daysInInterval, employee.id, shifts, leave);
                            
                            if (text.includes('{{schedule_start}}')) text = text.replace('{{schedule_start}}', dayData.schedule_start);
                            if (text.includes('{{schedule_end}}')) text = text.replace('{{schedule_end}}', dayData.schedule_end);
                            if (text.includes('{{unpaidbreak_start}}')) text = text.replace('{{unpaidbreak_start}}', dayData.unpaidbreak_start);
                            if (text.includes('{{unpaidbreak_end}}')) text = text.replace('{{unpaidbreak_end}}', dayData.unpaidbreak_end);
                            if (text.includes('{{paidbreak_start}}')) text = text.replace('{{paidbreak_start}}', dayData.paidbreak_start);
                            if (text.includes('{{paidbreak_end}}')) text = text.replace('{{paidbreak_end}}', dayData.paidbreak_end);
                            if (text.includes('{{day_status}}')) text = text.replace('{{day_status}}', dayData.day_status);

                            cell.value = text;
                        }
                    });
                 }
            });


            const uint8Array = await workbook.xlsx.writeBuffer();
            const blob = new Blob([uint8Array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `Regular Work Schedule - ${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}.xlsx`);

        } catch (error) {
            console.error("Error generating report:", error);
            toast({ variant: 'destructive', title: 'Report Generation Failed', description: (error as Error).message });
        }
    };
    
    // This is a simplified lookup. A real implementation would need to handle multiple days.
    // The current template variable names suggest one set of values per employee.
    const findDataForDay = (days: Date[], employeeId: string, shifts: Shift[], leave: Leave[]) => {
         // For simplicity, we'll just check the first day of the range.
         // A more complex report would iterate through rows for each day.
        const day = days[0]; 
        const shift = shifts.find(s => s.employeeId === employeeId && !s.isDayOff && !s.isHolidayOff && isSameDay(new Date(s.date), day));
        const dayOff = shifts.find(s => s.employeeId === employeeId && (s.isDayOff || s.isHolidayOff) && isSameDay(new Date(s.date), day));
        const leaveEntry = leave.find(l => l.employeeId === employeeId && isSameDay(new Date(l.date), day));

        if (dayOff || leaveEntry) {
            return { day_status: 'OFF', schedule_start: '', schedule_end: '', unpaidbreak_start: '', unpaidbreak_end: '', paidbreak_start: '', paidbreak_end: '' };
        }

        if (shift) {
            const unpaid = shift.isUnpaidBreak;
            return {
                day_status: '',
                schedule_start: shift.startTime,
                schedule_end: shift.endTime,
                unpaidbreak_start: unpaid ? shift.breakStartTime || '' : '',
                unpaidbreak_end: unpaid ? shift.breakEndTime || '' : '',

                paidbreak_start: !unpaid ? shift.breakStartTime || '' : '',
                paidbreak_end: !unpaid ? shift.breakEndTime || '' : '',
            };
        }

        return { day_status: 'Not Scheduled', schedule_start: '', schedule_end: '', unpaidbreak_start: '', unpaidbreak_end: '', paidbreak_start: '', paidbreak_end: '' };
    }


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Generate Reports</CardTitle>
                    <CardDescription>
                        Create and download reports based on your schedule data. Select a report type to begin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-2">Regular Work Schedule</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Generate a report of employee work schedules for a specific period.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date range</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={() => setIsUploaderOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Template
                            </Button>
                        </div>
                    </Card>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleDownloadReport} disabled={!dateRange || !template}>
                        <Download className="mr-2 h-4 w-4" />
                        Generate & Download
                    </Button>
                </CardFooter>
            </Card>
            <ReportTemplateUploader
                isOpen={isUploaderOpen}
                setIsOpen={setIsUploaderOpen}
                onTemplateUpload={setTemplate}
            />
        </>
    );
}

