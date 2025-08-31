
'use client';

import React, { useState, useMemo } from 'react';
import type { Employee, Shift, Leave, Holiday } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Download, Upload, Calendar as CalendarIcon, Eye } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn, getInitialState } from '@/lib/utils';
import { format, eachDayOfInterval, isSameDay, getDate, startOfWeek, endOfWeek, parse } from 'date-fns';
import { ReportTemplateUploader } from './report-template-uploader';
import { AttendanceTemplateUploader } from './attendance-template-uploader';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { initialShiftTemplates, initialLeaveTypes } from '@/lib/data';
import type { ShiftTemplate } from './shift-editor';
import { ReportPreviewDialog } from './report-preview-dialog';


type ReportsViewProps = {
    employees: Employee[];
    shifts: Shift[];
    leave: Leave[];
    holidays: Holiday[];
    currentUser: Employee;
}

type ReportData = {
    headers: string[];
    rows: (string | number)[][];
};

export default function ReportsView({ employees, shifts, leave, holidays, currentUser }: ReportsViewProps) {
    const { toast } = useToast();
    const [workScheduleDateRange, setWorkScheduleDateRange] = useState<DateRange | undefined>();
    const [attendanceWeek, setAttendanceWeek] = useState<Date | undefined>();
    const [summaryDateRange, setSummaryDateRange] = useState<DateRange | undefined>();


    const [workScheduleTemplate, setWorkScheduleTemplate] = useState<string | null>(() => getInitialState('workScheduleTemplate', null));
    const [attendanceTemplate, setAttendanceTemplate] = useState<string | null>(() => getInitialState('attendanceSheetTemplate', null));

    const [isWorkScheduleUploaderOpen, setIsWorkScheduleUploaderOpen] = useState(false);
    const [isAttendanceUploaderOpen, setIsAttendanceUploaderOpen] = useState(false);
    
    const [previewData, setPreviewData] = useState<ReportData | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [reportGenerator, setReportGenerator] = useState<(() => Promise<void>) | null>(null);
    const [reportTitle, setReportTitle] = useState('');


    const attendanceDateRange = useMemo(() => {
        if (!attendanceWeek) return undefined;
        const start = startOfWeek(attendanceWeek, { weekStartsOn: 1 });
        const end = endOfWeek(attendanceWeek, { weekStartsOn: 1 });
        return { from: start, to: end };
    }, [attendanceWeek]);

    // --- Data Generation Functions ---

    const generateWorkScheduleData = (): ReportData | null => {
         if (!workScheduleDateRange || !workScheduleDateRange.from || !workScheduleDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a covered period for the report.' });
            return null;
        }
        const groupEmployees = employees.filter(e => e.group === currentUser.group);
        const daysInInterval = eachDayOfInterval({ start: workScheduleDateRange.from, end: workScheduleDateRange.to });

        const headers = ['Employee Name', 'Date', 'Day Status', 'Schedule Start', 'Schedule End', 'Unpaid Break Start', 'Unpaid Break End', 'Paid Break Start', 'Paid Break End'];
        const rows: (string | number)[][] = [];

        groupEmployees.forEach((employee) => {
            daysInInterval.forEach(day => {
                const dayData = findDataForDay(day, employee, shifts, leave, holidays);
                rows.push([
                    `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase(),
                    format(day, 'M/d/yyyy'),
                    dayData.day_status,
                    dayData.schedule_start,
                    dayData.schedule_end,
                    dayData.unpaidbreak_start,
                    dayData.unpaidbreak_end,
                    dayData.paidbreak_start,
                    dayData.paidbreak_end,
                ]);
            });
        });
        
        return { headers, rows };
    };

    const findDataForDay = (day: Date, employee: Employee, allShifts: Shift[], allLeave: Leave[], allHolidays: Holiday[]) => {
        const shift = allShifts.find(s => s.employeeId === employee.id && !s.isDayOff && !s.isHolidayOff && isSameDay(new Date(s.date), day));
        const dayOff = allShifts.find(s => s.employeeId === employee.id && s.isDayOff && isSameDay(new Date(s.date), day));
        const holidayOff = allShifts.find(s => s.employeeId === employee.id && s.isHolidayOff && isSameDay(new Date(s.date), day));
        const leaveEntry = allLeave.find(l => l.employeeId === employee.id && isSameDay(new Date(l.date), day));
        const holiday = allHolidays.find(h => isSameDay(new Date(h.date), day));

        const emptySchedule = { day_status: '', schedule_start: '', schedule_end: '', unpaidbreak_start: '', unpaidbreak_end: '', paidbreak_start: '', paidbreak_end: '' };
        
        if (dayOff) {
            return { ...emptySchedule, day_status: 'OFF' };
        }
        
        if (holidayOff || leaveEntry || holiday) {
             let defaultTemplate: ShiftTemplate | undefined;
             if (employee.position?.toLowerCase().includes('manager')) {
                defaultTemplate = initialShiftTemplates.find(t => t.name === "Manager Shift (10:00-19:00)");
            } else {
                defaultTemplate = initialShiftTemplates.find(t => t.name === "Mid Shift (10:00-18:00)");
            }

            if (defaultTemplate) {
                 return {
                    day_status: holidayOff ? 'HOLIDAY OFF' : '',
                    schedule_start: defaultTemplate.startTime,
                    schedule_end: defaultTemplate.endTime,
                    unpaidbreak_start: defaultTemplate.isUnpaidBreak ? defaultTemplate.breakStartTime || '' : '',
                    unpaidbreak_end: defaultTemplate.isUnpaidBreak ? defaultTemplate.breakEndTime || '' : '',
                    paidbreak_start: !defaultTemplate.isUnpaidBreak ? defaultTemplate.breakStartTime || '' : '',
                    paidbreak_end: !defaultTemplate.isUnpaidBreak ? defaultTemplate.breakEndTime || '' : '',
                };
            }
            return { ...emptySchedule, day_status: holidayOff ? 'HOLIDAY OFF' : '' };
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

        return { ...emptySchedule, day_status: '' };
    }


    const handleDownloadWorkSchedule = async (data: ReportData | null) => {
        if (!data) {
            toast({ variant: 'destructive', title: 'Data Missing', description: 'Could not generate data for the report.' });
            return;
        }
        if (!workScheduleTemplate) {
            toast({ variant: 'destructive', title: 'No Template', description: 'Please upload a work schedule template first.' });
            return;
        }
        if (!workScheduleDateRange || !workScheduleDateRange.from || !workScheduleDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a covered period for the report.' });
            return;
        }
        
        try {
            const workbook = new ExcelJS.Workbook();
            const buffer = Buffer.from(workScheduleTemplate, 'binary');
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new Error("Template worksheet not found.");

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
            let templateColCount = 0;

            worksheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
                 row.eachCell({ includeEmpty: true }, (cell) => {
                    if (typeof cell.value === 'string' && cell.value.includes('{{employee_name}}')) {
                       if (!templateRowData) {
                          const values: any[] = [];
                          const styles: Partial<ExcelJS.Style>[] = [];
                          templateColCount = row.actualCellCount;
                          row.eachCell({ includeEmpty: true }, (c, colIdx) => {
                            // Ensure we only read up to the actual number of cells in template
                             if (colIdx <= templateColCount) {
                                values[c.col] = c.value;
                                styles[c.col] = c.style;
                             }
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
            
            data.rows.forEach(rowData => {
                const newRowValues = templateRowData!.values.map(cellValue => {
                    if (typeof cellValue !== 'string') return cellValue;
                    
                    let text = cellValue;
                    text = text.replace(/{{employee_name}}/g, String(rowData[0]));
                    text = text.replace(/{{date}}/g, String(rowData[1]));
                    text = text.replace(/{{day_status}}/g, String(rowData[2]));
                    text = text.replace(/{{schedule_start}}/g, String(rowData[3]));
                    text = text.replace(/{{schedule_end}}/g, String(rowData[4]));
                    text = text.replace(/{{unpaidbreak_start}}/g, String(rowData[5]));
                    text = text.replace(/{{unpaidbreak_end}}/g, String(rowData[6]));
                    text = text.replace(/{{paidbreak_start}}/g, String(rowData[7]));
                    text = text.replace(/{{paidbreak_end}}/g, String(rowData[8]));

                    return text;
                });
                
                worksheet.insertRow(currentRowIndex, newRowValues);
                
                const newRow = worksheet.getRow(currentRowIndex);
                newRow.height = templateRowData!.height;
                templateRowData!.styles.forEach((style, colNumber) => {
                    if (style && colNumber <= templateColCount) {
                       newRow.getCell(colNumber).style = style;
                    }
                });
                 
                currentRowIndex++;
            });

            worksheet.spliceRows(currentRowIndex, 1);

            const uint8Array = await workbook.xlsx.writeBuffer();
            const blob = new Blob([uint8Array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `Regular Work Schedule - ${format(workScheduleDateRange.from!, 'yyyy-MM-dd')} to ${format(workScheduleDateRange.to!, 'yyyy-MM-dd')}.xlsx`);

        } catch (error) {
            console.error("Error generating report:", error);
            toast({ variant: 'destructive', title: 'Report Generation Failed', description: (error as Error).message });
        }
    };
    
    // --- Attendance Sheet Functions ---

    const generateAttendanceSheetData = (): ReportData | null => {
        if (!attendanceDateRange || !attendanceDateRange.from || !attendanceDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a week for the attendance sheet.' });
            return null;
        }

        const groupEmployees = employees.filter(e => e.group === currentUser.group);
        const displayedDays = eachDayOfInterval({ start: attendanceDateRange.from, end: attendanceDateRange.to });

        const headers = ['Employee Name', 'Group', 'Position', ...displayedDays.map(d => format(d, 'EEE, MMM d'))];
        const rows: (string|number)[][] = [];

        groupEmployees.forEach(employee => {
            const row: (string|number)[] = [
                `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase(),
                employee.group || '',
                employee.position || ''
            ];
            
            displayedDays.forEach(day => {
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
                row.push(scheduleCode);
            });
            rows.push(row);
        });
        
        return { headers, rows };
    };

    const handleDownloadAttendanceSheet = async (data: ReportData | null) => {
         if (!data) {
            toast({ variant: 'destructive', title: 'Data Missing', description: 'Could not generate data for the report.' });
            return;
        }
         if (!attendanceTemplate) {
            toast({ variant: 'destructive', title: 'No Template', description: 'Please upload an attendance sheet template first.' });
            return;
        }
         if (!attendanceDateRange || !attendanceDateRange.from || !attendanceDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a date range for the attendance sheet.' });
            return;
        }
        
        try {
            const workbook = new ExcelJS.Workbook();
            const buffer = Buffer.from(attendanceTemplate, 'binary');
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new Error("Template worksheet not found.");

            const displayedDays = eachDayOfInterval({ start: attendanceDateRange.from, end: attendanceDateRange.to });

            // Find and replace header placeholders
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    if (cell.value && typeof cell.value === 'string') {
                        let cellText = cell.value;
                        if (cellText.includes('{{month}}')) {
                            cell.value = cellText.replace('{{month}}', format(attendanceDateRange.from!, 'MMMM').toUpperCase());
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
            for (let i = 0; i < data.rows.length; i++) {
                const employeeDataRow = data.rows[i]; // [Name, Group, Position, Day1, Day2, ...]
                const employeeIndex = i + 1; // 1-based index for placeholders

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        if (cell.value && typeof cell.value === 'string') {
                            let cellText = cell.value;

                            if (cellText.includes(`{{employee_${employeeIndex}}}`)) {
                                cell.value = cellText.replace(`{{employee_${employeeIndex}}}`, String(employeeDataRow[0]));
                            }
                             if (cellText.includes(`{{group_${employeeIndex}}}`)) {
                                cell.value = cellText.replace(`{{group_${employeeIndex}}}`, String(employeeDataRow[1]));
                            }
                            if (cellText.includes(`{{position_${employeeIndex}}}`)) {
                                cell.value = cellText.replace(`{{position_${employeeIndex}}}`, String(employeeDataRow[2]));
                            }

                            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                                if (cellText.includes(`{{schedule_${employeeIndex}_${dayIndex + 1}}}`)) {
                                    const scheduleCode = String(employeeDataRow[3 + dayIndex]);
                                    cell.value = cellText.replace(`{{schedule_${employeeIndex}_${dayIndex + 1}}}`, scheduleCode);
                                }
                            }
                        }
                    });
                });
            }

            const uint8Array = await workbook.xlsx.writeBuffer();
            const blob = new Blob([uint8Array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `${currentUser?.group} Attendance Sheet - ${format(attendanceDateRange.from, 'MMMM yyyy')}.xlsx`);

        } catch (error) {
            console.error("Error generating Excel from template:", error);
            toast({ variant: 'destructive', title: 'Template Error', description: (error as Error).message, duration: 8000 });
        }
    };
    
    // --- User Summary Functions ---

    const generateUserSummaryData = (): ReportData | null => {
        if (!summaryDateRange || !summaryDateRange.from || !summaryDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a covered period for the summary.' });
            return null;
        }

        const groupEmployees = employees.filter(e => e.group === currentUser.group);
        const leaveTypes = initialLeaveTypes.map(lt => lt.type);
        const headers = ['Employee Name', 'Total Shifts', 'Total Hours', ...leaveTypes];
        const rows: (string | number)[][] = [];
        
        const daysInInterval = eachDayOfInterval({ start: summaryDateRange.from, end: summaryDateRange.to });

        groupEmployees.forEach(employee => {
            const shiftsInRange = shifts.filter(s => 
                s.employeeId === employee.id &&
                !s.isDayOff && 
                !s.isHolidayOff &&
                daysInInterval.some(day => isSameDay(day, new Date(s.date)))
            );
            
            const leaveInRange = leave.filter(l => 
                l.employeeId === employee.id &&
                daysInInterval.some(day => isSameDay(day, new Date(l.date)))
            );

            const totalHours = shiftsInRange.reduce((acc, shift) => {
                if (!shift.startTime || !shift.endTime) return acc;
                const start = parse(shift.startTime, 'HH:mm', new Date());
                const end = parse(shift.endTime, 'HH:mm', new Date());
                let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (diff < 0) diff += 24;

                let breakHours = 0;
                if (shift.isUnpaidBreak && shift.breakStartTime && shift.breakEndTime) {
                    const breakStart = parse(shift.breakStartTime, 'HH:mm', new Date());
                    const breakEnd = parse(shift.breakEndTime, 'HH:mm', new Date());
                    let breakDiff = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
                    if (breakDiff < 0) breakDiff += 24;
                    breakHours = breakDiff;
                }
                
                return acc + (diff - breakHours);
            }, 0);
            
            const leaveCounts = leaveTypes.map(type => 
                leaveInRange.filter(l => l.type === type).length
            );
            
            rows.push([
                `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase(),
                shiftsInRange.length,
                totalHours.toFixed(2),
                ...leaveCounts
            ]);
        });
        
        return { headers, rows };
    };

    const handleDownloadUserSummary = async (data: ReportData | null) => {
        if (!data) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('User Summary');

        worksheet.columns = data.headers.map(header => ({
            header: header,
            key: header.toLowerCase().replace(/ /g, '_'),
            width: header === 'Employee Name' ? 30 : 15
        }));
        
        worksheet.addRows(data.rows);
        
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `User Summary - ${format(summaryDateRange!.from!, 'yyyy-MM-dd')} to ${format(summaryDateRange!.to!, 'yyyy-MM-dd')}.xlsx`);
    };
    
    // --- Event Handlers ---
    
    const handleViewReport = (type: 'workSchedule' | 'attendance' | 'userSummary') => {
        let data: ReportData | null = null;
        let title = '';
        let generator: (() => Promise<void>) | null = null;

        if (type === 'workSchedule') {
            data = generateWorkScheduleData();
            if (data) {
                title = `Regular Work Schedule (${format(workScheduleDateRange!.from!, 'LLL d')} - ${format(workScheduleDateRange!.to!, 'LLL d, y')})`;
                generator = () => handleDownloadWorkSchedule(data);
            }
        } else if (type === 'attendance') {
            data = generateAttendanceSheetData();
            if (data) {
                title = `Attendance Sheet (${format(attendanceDateRange!.from!, 'LLL d')} - ${format(attendanceDateRange!.to!, 'LLL d, y')})`;
                generator = () => handleDownloadAttendanceSheet(data);
            }
        } else if (type === 'userSummary') {
            data = generateUserSummaryData();
            if (data) {
                title = `User Summary (${format(summaryDateRange!.from!, 'LLL d')} - ${format(summaryDateRange!.to!, 'LLL d, y')})`;
                generator = () => handleDownloadUserSummary(data);
            }
        }
        
        if (data) {
            setPreviewData(data);
            setReportTitle(title);
            setReportGenerator(() => generator);
            setIsPreviewOpen(true);
        }
    }

    const handleDirectDownload = (type: 'workSchedule' | 'attendance' | 'userSummary') => {
        if (type === 'workSchedule') {
            handleDownloadWorkSchedule(generateWorkScheduleData());
        } else if (type === 'attendance') {
            handleDownloadAttendanceSheet(generateAttendanceSheetData());
        } else if (type === 'userSummary') {
            handleDownloadUserSummary(generateUserSummaryData());
        }
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
                         <CardFooter className="px-0 pt-6 pb-0 flex gap-2">
                             <Button onClick={() => handleViewReport('workSchedule')} disabled={!workScheduleDateRange}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Report
                            </Button>
                            <Button onClick={() => handleDirectDownload('workSchedule')} disabled={!workScheduleDateRange || !workScheduleTemplate}>
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
                         <CardFooter className="px-0 pt-6 pb-0 flex gap-2">
                            <Button onClick={() => handleViewReport('attendance')} disabled={!attendanceDateRange}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Report
                            </Button>
                            <Button onClick={() => handleDirectDownload('attendance')} disabled={!attendanceDateRange || !attendanceTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Generate & Download
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-2">Summary Per User</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Generate an individual summary of shifts, hours, and leave for each employee.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="summary-date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !summaryDateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {summaryDateRange?.from ? (
                                    summaryDateRange.to ? (
                                        <>
                                        {format(summaryDateRange.from, "LLL dd, y")} -{" "}
                                        {format(summaryDateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(summaryDateRange.from, "LLL dd, y")
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
                                    defaultMonth={summaryDateRange?.from}
                                    selected={summaryDateRange}
                                    onSelect={setSummaryDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <CardFooter className="px-0 pt-6 pb-0 flex gap-2">
                             <Button onClick={() => handleViewReport('userSummary')} disabled={!summaryDateRange}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Report
                            </Button>
                            <Button onClick={() => handleDirectDownload('userSummary')} disabled={!summaryDateRange}>
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
            <ReportPreviewDialog 
                isOpen={isPreviewOpen}
                setIsOpen={setIsPreviewOpen}
                title={reportTitle}
                data={previewData}
                onDownload={reportGenerator}
            />
        </>
    );
}
