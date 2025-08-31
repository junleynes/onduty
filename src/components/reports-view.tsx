
'use client';

import React, { useState, useMemo } from 'react';
import type { Employee, Shift, Leave, Holiday } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Download, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn, getInitialState } from '@/lib/utils';
import { format, eachDayOfInterval, isSameDay, getDate, startOfWeek, endOfWeek } from 'date-fns';
import { ReportTemplateUploader } from './report-template-uploader';
import { AttendanceTemplateUploader } from './attendance-template-uploader';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { initialShiftTemplates } from '@/lib/data';
import type { ShiftTemplate } from './shift-editor';

type ReportsViewProps = {
    employees: Employee[];
    shifts: Shift[];
    leave: Leave[];
    holidays: Holiday[];
    currentUser: Employee;
}

export default function ReportsView({ employees, shifts, leave, holidays, currentUser }: ReportsViewProps) {
    const { toast } = useToast();
    const [workScheduleDateRange, setWorkScheduleDateRange] = useState<DateRange | undefined>();
    const [attendanceWeek, setAttendanceWeek] = useState<Date | undefined>();

    const [workScheduleTemplate, setWorkScheduleTemplate] = useState<string | null>(() => getInitialState('workScheduleTemplate', null));
    const [attendanceTemplate, setAttendanceTemplate] = useState<string | null>(() => getInitialState('attendanceSheetTemplate', null));

    const [isWorkScheduleUploaderOpen, setIsWorkScheduleUploaderOpen] = useState(false);
    const [isAttendanceUploaderOpen, setIsAttendanceUploaderOpen] = useState(false);
    
    const attendanceDateRange = useMemo(() => {
        if (!attendanceWeek) return undefined;
        const start = startOfWeek(attendanceWeek, { weekStartsOn: 1 });
        const end = endOfWeek(attendanceWeek, { weekStartsOn: 1 });
        return { from: start, to: end };
    }, [attendanceWeek]);


    const handleDownloadWorkSchedule = async () => {
        if (!workScheduleTemplate) {
            toast({ variant: 'destructive', title: 'No Template', description: 'Please upload a work schedule template first.' });
            return;
        }
        if (!workScheduleDateRange || !workScheduleDateRange.from || !workScheduleDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a covered period for the report.' });
            return;
        }
        
        try {
            const groupEmployees = employees.filter(e => e.group === currentUser.group);
            const workbook = new ExcelJS.Workbook();
            const buffer = Buffer.from(workScheduleTemplate, 'binary');
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new Error("Template worksheet not found.");
            
            const daysInInterval = eachDayOfInterval({ start: workScheduleDateRange.from, end: workScheduleDateRange.to });

            // Find and replace global placeholders
            worksheet.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    if (cell.value && typeof cell.value === 'string') {
                        let cellText = cell.value;
                        if (cellText.includes('{{start_date}}')) {
                            cell.value = cellText.replace('{{start_date}}', format(workScheduleDateRange.from!, 'MM/dd/yyyy'));
                        }
                        if (cellText.includes('{{end_date}}')) {
                            cell.value = cellText.replace('{{end_date}}', format(workScheduleDateRange.to!, 'MM/dd/yyyy'));
                        }
                    }
                });
            });

            // Find the template row
            let templateRowData: { values: any[], styles: Partial<ExcelJS.Style>[], height: number } | null = null;
            let templateRowNumber = -1;

            worksheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
                 row.eachCell({ includeEmpty: true }, (cell) => {
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
            saveAs(blob, `Regular Work Schedule - ${format(workScheduleDateRange.from!, 'yyyy-MM-dd')} to ${format(workScheduleDateRange.to!, 'yyyy-MM-dd')}.xlsx`);

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
        if (holidayOff) {
             return { ...emptySchedule, day_status: 'HOLIDAY OFF' };
        }
        
        if (leaveEntry) {
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

    const handleDownloadAttendanceSheet = async () => {
         if (!attendanceTemplate) {
            toast({ variant: 'destructive', title: 'No Template', description: 'Please upload an attendance sheet template first.' });
            return;
        }
         if (!attendanceDateRange || !attendanceDateRange.from || !attendanceDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a date range for the attendance sheet.' });
            return;
        }
        
        const buffer = await generateAttendanceSheetExcel(attendanceDateRange);
        if (!buffer) return;

        const groupName = currentUser?.group || 'Team';
        const fileName = `${groupName} Attendance Sheet - ${format(attendanceDateRange.from, 'MMMM yyyy')}.xlsx`;
        
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, fileName);

        toast({ title: 'Report Downloaded', description: 'The attendance report has been saved as an Excel file.' });
    };

    const generateAttendanceSheetExcel = async (dateRange: DateRange): Promise<Buffer | null> => {
        if (!attendanceTemplate || !dateRange.from || !dateRange.to) {
            toast({ variant: 'destructive', title: 'No Template or Date', description: 'Please upload an attendance sheet template and select a date range.' });
            return null;
        }

        try {
            const groupEmployees = employees.filter(e => e.group === currentUser.group);
            const workbook = new ExcelJS.Workbook();
            const buffer = Buffer.from(attendanceTemplate, 'binary');
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new Error("Template worksheet not found.");

            const displayedDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

            // Find and replace header placeholders
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    if (cell.value && typeof cell.value === 'string') {
                        let cellText = cell.value;
                        if (cellText.includes('{{month}}')) {
                            cell.value = cellText.replace('{{month}}', format(dateRange.from!, 'MMMM').toUpperCase());
                        }
                        if (cellText.includes('{{group}}')) {
                            cell.value = cellText.replace('{{group}}', currentUser.group || '');
                        }
                        for (let i = 0; i < 7 && i < displayedDays.length; i++) {
                            if (cellText.includes(`{{day_${i + 1}}}`) && displayedDays[i]) {
                                cell.value = cellText.replace(`{{day_${i + 1}}}`, String(getDate(displayedDays[i])));
                            }
                        }
                    }
                });
            });

            // Find and replace employee data placeholders
            for (let i = 0; i < groupEmployees.length; i++) {
                const employee = groupEmployees[i];
                const employeeIndex = i + 1; // 1-based index for placeholders

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        if (cell.value && typeof cell.value === 'string') {
                            let cellText = cell.value;

                            if (cellText.includes(`{{employee_${employeeIndex}}}`)) {
                                cell.value = cellText.replace(`{{employee_${employeeIndex}}}`, `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase());
                            }
                            if (cellText.includes(`{{group_${employeeIndex}}}`)) {
                                cell.value = cellText.replace(`{{group_${employeeIndex}}}`, employee.group || '');
                            }
                            if (cellText.includes(`{{position_${employeeIndex}}}`)) {
                                cell.value = cellText.replace(`{{position_${employeeIndex}}}`, employee.position || '');
                            }

                            for (let dayIndex = 0; dayIndex < displayedDays.length; dayIndex++) {
                                const day = displayedDays[dayIndex];
                                if (cellText.includes(`{{schedule_${employeeIndex}_${dayIndex + 1}}}`)) {
                                    const shift = shifts.find(s => s.employeeId === employee.id && isSameDay(new Date(s.date), day));
                                    const leaveEntry = leave.find(l => l.employeeId === employee.id && isSameDay(new Date(l.date), day));
                                    const holiday = holidays.find(h => isSameDay(new Date(h.date), day));
                                    
                                    let scheduleCode = '';
                                    if (shift?.isHolidayOff || (holiday && (!shift || shift.isDayOff))) scheduleCode = 'HOL OFF';
                                    else if (leaveEntry) scheduleCode = leaveEntry.type.toUpperCase();
                                    else if (shift?.isDayOff) scheduleCode = 'OFF';
                                    else if (shift) {
                                       const shiftLabel = shift.label?.trim().toUpperCase();
                                       scheduleCode = (shiftLabel === 'WORK FROM HOME' || shiftLabel === 'WFH') ? 'WFH' : 'SKE';
                                    }
                                    
                                    cell.value = cellText.replace(`{{schedule_${employeeIndex}_${dayIndex + 1}}}`, scheduleCode);
                                }
                            }
                        }
                    });
                });
            }

            const uint8Array = await workbook.xlsx.writeBuffer();
            return Buffer.from(uint8Array);

        } catch (error) {
            console.error("Error generating Excel from template:", error);
            toast({ variant: 'destructive', title: 'Template Error', description: (error as Error).message, duration: 8000 });
            return null;
        }
    };


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
                                    !workScheduleDateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {workScheduleDateRange?.from ? (
                                    workScheduleDateRange.to ? (
                                        <>
                                        {format(workScheduleDateRange.from, "LLL dd, y")} -{" "}
                                        {format(workScheduleDateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(workScheduleDateRange.from, "LLL dd, y")
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
                                    defaultMonth={workScheduleDateRange?.from}
                                    selected={workScheduleDateRange}
                                    onSelect={setWorkScheduleDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={() => setIsWorkScheduleUploaderOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Template
                            </Button>
                        </div>
                         <CardFooter className="px-0 pt-6 pb-0">
                            <Button onClick={handleDownloadWorkSchedule} disabled={!workScheduleDateRange || !workScheduleTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Generate & Download
                            </Button>
                        </CardFooter>
                    </Card>

                     <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-2">Attendance Sheet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Generate a weekly attendance sheet (Mon-Sun) based on a template.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="attendance-date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !attendanceDateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {attendanceDateRange?.from ? (
                                        <>
                                        {format(attendanceDateRange.from, "LLL dd, y")} -{" "}
                                        {format(attendanceDateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                    <span>Pick a week</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="single"
                                    selected={attendanceWeek}
                                    onSelect={setAttendanceWeek}
                                />
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={() => setIsAttendanceUploaderOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Template
                            </Button>
                        </div>
                         <CardFooter className="px-0 pt-6 pb-0">
                            <Button onClick={handleDownloadAttendanceSheet} disabled={!attendanceDateRange || !attendanceTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Generate & Download
                            </Button>
                        </CardFooter>
                    </Card>

                </CardContent>
            </Card>
            <ReportTemplateUploader
                isOpen={isWorkScheduleUploaderOpen}
                setIsOpen={setIsWorkScheduleUploaderOpen}
                onTemplateUpload={setWorkScheduleTemplate}
            />
            <AttendanceTemplateUploader
                isOpen={isAttendanceUploaderOpen}
                setIsOpen={setIsAttendanceUploaderOpen}
                onTemplateUpload={setAttendanceTemplate}
            />
        </>
    );
}
