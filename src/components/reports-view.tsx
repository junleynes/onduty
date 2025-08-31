
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
import { initialShiftTemplates } from '@/lib/data';
import type { ShiftTemplate } from './shift-editor';

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

            // Find the template row
            let templateRowData: { values: any[], styles: Partial<ExcelJS.Style>[], height: number } | null = null;
            let templateRowNumber = -1;

            worksheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
                 row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    if (typeof cell.value === 'string' && cell.value.includes('{{employee_name}}')) {
                       if (!templateRowData) {
                          const values: any[] = [];
                          const styles: Partial<ExcelJS.Style>[] = [];
                          row.eachCell({ includeEmpty: true }, c => {
                            values[c.col] = c.value;
                            styles[c.col] = c.style;
                          });

                          templateRowData = { values, styles, height: row.height };
                          templateRowNumber = rowNum;
                       }
                    }
                 });
            });
            

            if (!templateRowData || templateRowNumber === -1) {
                throw new Error("No template row with `{{employee_name}}` placeholder found in the template.");
            }
            
            let currentRowIndex = templateRowNumber;
            
            groupEmployees.forEach((employee) => {
                 daysInInterval.forEach(day => {
                    const dayData = findDataForDay(day, employee, shifts, leave);
                     
                    const newRowValues = templateRowData!.values.map(cellValue => {
                        if (typeof cellValue !== 'string') return cellValue;

                        let text = cellValue;
                        text = text.replace(/{{employee_name}}/g, `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase());
                        text = text.replace(/{{date}}/g, format(day, 'M/d/yyyy'));
                        text = text.replace(/{{schedule_start}}/g, dayData.schedule_start);
                        text = text.replace(/{{schedule_end}}/g, dayData.schedule_end);
                        text = text.replace(/{{unpaidbreak_start}}/g, dayData.unpaidbreak_start);
                        text = text.replace(/{{unpaidbreak_end}}/g, dayData.unpaidbreak_end);
                        text = text.replace(/{{paidbreak_start}}/g, dayData.paidbreak_start);
                        text = text.replace(/{{paidbreak_end}}/g, dayData.paidbreak_end);
                        text = text.replace(/{{day_status}}/g, dayData.day_status);

                        return text;
                    });
                    
                    worksheet.insertRow(currentRowIndex, newRowValues);
                    
                    // Copy styles from the template row
                    const newRow = worksheet.getRow(currentRowIndex);
                    newRow.height = templateRowData!.height;
                    templateRowData!.styles.forEach((style, colNumber) => {
                        if (style) {
                           newRow.getCell(colNumber).style = style;
                        }
                    });
                     
                    currentRowIndex++;
                 });
            });

            // Delete the original template row
            worksheet.spliceRows(currentRowIndex, 1);


            const uint8Array = await workbook.xlsx.writeBuffer();
            const blob = new Blob([uint8Array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `Regular Work Schedule - ${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}.xlsx`);

        } catch (error) {
            console.error("Error generating report:", error);
            toast({ variant: 'destructive', title: 'Report Generation Failed', description: (error as Error).message });
        }
    };
    
    const findDataForDay = (day: Date, employee: Employee, allShifts: Shift[], allLeave: Leave[]) => {
        const shift = allShifts.find(s => s.employeeId === employee.id && !s.isDayOff && !s.isHolidayOff && isSameDay(new Date(s.date), day));
        const dayOff = allShifts.find(s => s.employeeId === employee.id && s.isDayOff && isSameDay(new Date(s.date), day));
        const holidayOff = allShifts.find(s => s.employeeId === employee.id && s.isHolidayOff && isSameDay(new Date(s.date), day));
        const leaveEntry = allLeave.find(l => l.employeeId === employee.id && isSameDay(new Date(l.date), day));

        const emptySchedule = { day_status: '', schedule_start: '', schedule_end: '', unpaidbreak_start: '', unpaidbreak_end: '', paidbreak_start: '', paidbreak_end: '' };
        
        if (dayOff) {
            return { ...emptySchedule, day_status: 'OFF' };
        }
        
        if (holidayOff || leaveEntry) {
            let defaultTemplate: ShiftTemplate | undefined;
             if (employee.position?.toLowerCase().includes('manager')) {
                defaultTemplate = initialShiftTemplates.find(t => t.name === "Manager Shift (10:00-19:00)");
            } else {
                defaultTemplate = initialShiftTemplates.find(t => t.name === "Mid Shift (10:00-18:00)");
            }

            if (defaultTemplate) {
                 return {
                    day_status: '',
                    schedule_start: defaultTemplate.startTime,
                    schedule_end: defaultTemplate.endTime,
                    unpaidbreak_start: defaultTemplate.isUnpaidBreak ? defaultTemplate.breakStartTime || '' : '',
                    unpaidbreak_end: defaultTemplate.isUnpaidBreak ? defaultTemplate.breakEndTime || '' : '',
                    paidbreak_start: !defaultTemplate.isUnpaidBreak ? defaultTemplate.breakStartTime || '' : '',
                    paidbreak_end: !defaultTemplate.isUnpaidBreak ? defaultTemplate.breakEndTime || '' : '',
                };
            }
             // Fallback if templates aren't found
            return { ...emptySchedule, day_status: '' };
        }

        if (shift) {
             return {
                day_status: '',
                schedule_start: shift.startTime,
                schedule_end: shift.endTime,
                unpaidbreak_start: shift.isUnpaidBreak ? shift.breakStartTime || '' : '',
                unpaidbreak_end: shift.isUnpaidBreak ? shift.breakEndTime || '' : '',
                paidbreak_start: !shift.isUnpaidBreak ? shift.breakStartTime || '' : '',
                paidbreak_end: !shift.isUnpaidBreak ? shift.breakEndTime || '' : '',
            };
        }

        return { ...emptySchedule, day_status: 'Not Scheduled' };
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
