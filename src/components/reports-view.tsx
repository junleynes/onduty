

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Shift, Leave, Holiday, TardyRecord } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Download, Upload, Calendar as CalendarIcon, Eye } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn, getFullName, getInitialState } from '@/lib/utils';
import { format, eachDayOfInterval, isSameDay, getDate, startOfWeek, endOfWeek, parse, isWithinInterval, startOfMonth, endOfMonth, addMonths, getMonth } from 'date-fns';
import { ReportTemplateUploader } from './report-template-uploader';
import { AttendanceTemplateUploader } from './attendance-template-uploader';
import { WfhCertificationTemplateUploader } from './wfh-certification-template-uploader';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { initialShiftTemplates, initialLeaveTypes } from '@/lib/data';
import type { ShiftTemplate } from './shift-editor';
import { ReportPreviewDialog } from './report-preview-dialog';
import { TardyImporter } from './tardy-importer';


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

type WorkScheduleRowData = {
    employee_name: string;
    date: string;
    day_status: string;
    schedule_start: string;
    schedule_end: string;
    unpaidbreak_start: string;
    unpaidbreak_end: string;
    paidbreak_start: string;
    paidbreak_end: string;
};

type WfhCertRowData = {
    DATE: string;
    ATTENDANCE_RENDERED: string;
    TOTAL_HRS_SPENT: string | number;
    REMARKS: string;
}


export default function ReportsView({ employees, shifts, leave, holidays, currentUser }: ReportsViewProps) {
    const { toast } = useToast();
    const [workScheduleDateRange, setWorkScheduleDateRange] = useState<DateRange | undefined>();
    const [attendanceWeek, setAttendanceWeek] = useState<Date | undefined>();
    const [summaryDateRange, setSummaryDateRange] = useState<DateRange | undefined>();
    const [tardyDateRange, setTardyDateRange] = useState<DateRange | undefined>();
    const [wfhCertMonth, setWfhCertMonth] = useState<Date | undefined>();

    const [tardyRecords, setTardyRecords] = useState<TardyRecord[]>(() => getInitialState('tardyRecords', []));


    const [workScheduleTemplate, setWorkScheduleTemplate] = useState<string | null>(() => getInitialState('workScheduleTemplate', null));
    const [attendanceTemplate, setAttendanceTemplate] = useState<string | null>(() => getInitialState('attendanceSheetTemplate', null));
    const [wfhCertTemplate, setWfhCertTemplate] = useState<string | null>(() => getInitialState('wfhCertificationTemplate', null));

    const [isWorkScheduleUploaderOpen, setIsWorkScheduleUploaderOpen] = useState(false);
    const [isAttendanceUploaderOpen, setIsAttendanceUploaderOpen] = useState(false);
    const [isWfhCertUploaderOpen, setIsWfhCertUploaderOpen] = useState(false);
    const [isTardyImporterOpen, setIsTardyImporterOpen] = useState(false);
    
    const [previewData, setPreviewData] = useState<ReportData | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [reportGenerator, setReportGenerator] = useState<(() => Promise<void>) | null>(null);
    const [reportTitle, setReportTitle] = useState('');

    const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';


    const attendanceDateRange = useMemo(() => {
        if (!attendanceWeek) return undefined;
        const start = startOfWeek(attendanceWeek, { weekStartsOn: 1 });
        const end = endOfWeek(attendanceWeek, { weekStartsOn: 1 });
        return { from: start, to: end };
    }, [attendanceWeek]);

    const wfhCertDateRange = useMemo(() => {
        if (!wfhCertMonth) return undefined;
        const start = startOfMonth(wfhCertMonth);
        const end = endOfMonth(wfhCertMonth);
        return { from: start, to: end };
    }, [wfhCertMonth]);

    // --- Data Generation Functions ---
    
    const getScheduleFromTemplate = (template: ShiftTemplate | undefined) => {
        if (!template) {
             return { day_status: '', schedule_start: '', schedule_end: '', unpaidbreak_start: '', unpaidbreak_end: '', paidbreak_start: '', paidbreak_end: '' };
        }
        return {
            schedule_start: template.startTime,
            schedule_end: template.endTime,
            unpaidbreak_start: template.isUnpaidBreak ? template.breakStartTime || '' : '',
            unpaidbreak_end: template.isUnpaidBreak ? template.breakEndTime || '' : '',
            paidbreak_start: !template.isUnpaidBreak ? template.breakStartTime || '' : '',
            paidbreak_end: !template.isUnpaidBreak ? template.breakEndTime || '' : '',
        };
    };
    
    const getDefaultShiftTemplate = (employee: Employee): ShiftTemplate | undefined => {
        const defaultShiftName = employee.role === 'manager' ? "manager shift" : "mid shift";
        return initialShiftTemplates.find(t => t.name.toLowerCase().includes(defaultShiftName));
    };

    const findDataForDay = (day: Date, employee: Employee, allShifts: Shift[], allLeave: Leave[], allHolidays: Holiday[]) => {
        const shift = allShifts.find(s => s.employeeId === employee.id && isSameDay(new Date(s.date), day));
        const leaveEntry = allLeave.find(l => l.employeeId === employee.id && isSameDay(new Date(l.date), day));
        const holiday = allHolidays.find(h => isSameDay(new Date(h.date), day));
        const emptySchedule = { day_status: '', schedule_start: '', schedule_end: '', unpaidbreak_start: '', unpaidbreak_end: '', paidbreak_start: '', paidbreak_end: '' };
        
        const defaultSchedule = getScheduleFromTemplate(getDefaultShiftTemplate(employee));

        if (leaveEntry) {
            return { ...defaultSchedule, day_status: '' };
        }
        
        if (shift?.isHolidayOff) {
            return { ...defaultSchedule, day_status: '' };
        }
        
        if (holiday && (!shift || shift.isDayOff)) {
             return { ...emptySchedule, day_status: 'HOLIDAY' };
        }
        
        if (shift) {
            if (shift.isDayOff) {
                return { ...emptySchedule, day_status: 'OFF' };
            }
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

        return emptySchedule;
    }


    const generateWorkScheduleData = (): WorkScheduleRowData[] | null => {
         if (!workScheduleDateRange || !workScheduleDateRange.from || !workScheduleDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a covered period for the report.' });
            return null;
        }
        const groupEmployees = employees
            .filter(e => e.group === currentUser.group)
            .sort((a, b) => {
                const lastNameComp = a.lastName.localeCompare(b.lastName);
                if (lastNameComp !== 0) return lastNameComp;
                return a.firstName.localeCompare(b.firstName);
            });

        const daysInInterval = eachDayOfInterval({ start: workScheduleDateRange.from, end: workScheduleDateRange.to });

        const rows: WorkScheduleRowData[] = [];

        groupEmployees.forEach((employee) => {
            daysInInterval.forEach(day => {
                const dayData = findDataForDay(day, employee, shifts, leave, holidays);
                rows.push({
                    employee_name: `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase(),
                    date: format(day, 'M/d/yyyy'),
                    ...dayData
                });
            });
        });
        
        return rows;
    };
    
    const generateWorkSchedulePreviewData = (data: WorkScheduleRowData[] | null): ReportData | null => {
        if (!data) return null;
        const headers = ['Employee Name', 'Date', 'Day Status', 'Schedule Start', 'Schedule End', 'Unpaid Break Start', 'Unpaid Break End', 'Paid Break Start', 'Paid Break End'];
        const rows = data.map(d => [
            d.employee_name,
            d.date,
            d.day_status,
            d.schedule_start,
            d.schedule_end,
            d.unpaidbreak_start,
            d.unpaidbreak_end,
            d.paidbreak_start,
            d.paidbreak_end,
        ]);
        return { headers, rows };
    }
    
    const handleDownloadWorkSchedule = async (data: WorkScheduleRowData[] | null) => {
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
                        cellText = cellText.replace(/{{start_date}}/g, format(workScheduleDateRange.from!, 'MM/dd/yyyy'));
                        cellText = cellText.replace(/{{end_date}}/g, format(workScheduleDateRange.to!, 'MM/dd/yyyy'));
                        cell.value = cellText;
                    }
                });
            });

            // Find the template row
            let templateRowNumber = -1;
            worksheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
                 row.eachCell({ includeEmpty: true }, (cell) => {
                    if (typeof cell.value === 'string' && cell.value.includes('{{employee_name}}')) {
                       templateRowNumber = rowNum;
                    }
                 });
            });
            
            if (templateRowNumber === -1) {
                throw new Error("No template row with `{{employee_name}}` placeholder found in the template.");
            }
            
            const templateRow = worksheet.getRow(templateRowNumber);

            const placeholderMap: { [key: string]: keyof WorkScheduleRowData } = {
                '{{employee_name}}': 'employee_name',
                '{{date}}': 'date',
                '{{day_status}}': 'day_status',
                '{{schedule_start}}': 'schedule_start',
                '{{schedule_end}}': 'schedule_end',
                '{{unpaidbreak_start}}': 'unpaidbreak_start',
                '{{unpaidbreak_end}}': 'unpaidbreak_end',
                '{{paidbreak_start}}': 'paidbreak_start',
                '{{paidbreak_end}}': 'paidbreak_end',
            };
            
            const columnMapping: { col: number; dataKey: keyof WorkScheduleRowData }[] = [];
            templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const cellValue = cell.text;
                for (const placeholder in placeholderMap) {
                    if (cellValue.includes(placeholder)) {
                        columnMapping.push({ col: colNumber, dataKey: placeholderMap[placeholder] });
                    }
                }
            });
            
            data.forEach((rowData, index) => {
                const rowNumberToInsert = templateRowNumber + index;
                if (index > 0) {
                    worksheet.duplicateRow(templateRowNumber, 1, true);
                }
                const newRow = worksheet.getRow(rowNumberToInsert);
                
                columnMapping.forEach(({ col, dataKey }) => {
                    newRow.getCell(col).value = rowData[dataKey];
                });
                newRow.commit();
            });

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
            saveAs(blob, `${currentUser?.group} Attendance Sheet - ${format(attendanceDateRange.from, 'yyyy-MM-dd')} to ${format(attendanceDateRange.to, 'yyyy-MM-dd')}.xlsx`);

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

    // --- Cumulative Tardy Report ---
    const generateTardyReportData = (): ReportData | null => {
        if (!tardyDateRange || !tardyDateRange.from || !tardyDateRange.to) {
             toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a covered period for the summary.' });
            return null;
        }

        // 1. Get TARDY leave requests
        const tardyLeave = leave
            .filter(l => l.type === 'TARDY' && isWithinInterval(new Date(l.date), {start: tardyDateRange.from!, end: tardyDateRange.to!}))
            .map(l => {
                const employee = employees.find(e => e.id === l.employeeId);
                const shift = shifts.find(s => s.employeeId === l.employeeId && isSameDay(new Date(s.date), new Date(l.date)));
                return {
                    employeeId: l.employeeId,
                    employeeName: employee ? getFullName(employee) : 'Unknown',
                    date: new Date(l.date),
                    schedule: shift ? `${shift.startTime}-${shift.endTime}` : 'N/A',
                    timeIn: l.startTime || '',
                    timeOut: l.endTime || '',
                    remarks: l.reason || 'Applied via App'
                };
            });
        
        // 2. Filter imported records by date
        const filteredImportedRecords = tardyRecords.filter(r => 
            isWithinInterval(new Date(r.date), {start: tardyDateRange.from!, end: tardyDateRange.to!})
        );
        
        // 3. Combine and de-duplicate (imported takes precedence)
        const combinedRecords = [...filteredImportedRecords];
        const importedKeys = new Set(filteredImportedRecords.map(r => `${r.employeeId}-${format(new Date(r.date), 'yyyy-MM-dd')}`));
        
        tardyLeave.forEach(l => {
            const key = `${l.employeeId}-${format(new Date(l.date), 'yyyy-MM-dd')}`;
            if (!importedKeys.has(key)) {
                combinedRecords.push(l);
            }
        });

        // 4. Sort and format for the table
        combinedRecords.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.employeeName.localeCompare(b.employeeName));

        const headers = ['Employee', 'Date', 'Schedule', 'In/Out', 'Remarks'];
        const rows = combinedRecords.map(r => [
            r.employeeName,
            format(new Date(r.date), 'MM/dd/yyyy'),
            r.schedule,
            r.timeIn && r.timeOut ? `${r.timeIn}-${r.timeOut}` : '',
            r.remarks
        ]);

        return { headers, rows };
    };

    const handleDownloadTardyReport = async (data: ReportData | null) => {
        if (!data) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cumulative Tardy Report');

        worksheet.columns = data.headers.map(header => ({
            header: header,
            key: header.toLowerCase().replace(/ /g, '_'),
            width: header === 'Employee' ? 30 : header === 'Remarks' ? 40 : 20,
        }));
        
        worksheet.addRows(data.rows);
        
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };


        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Cumulative Tardy Report - ${format(tardyDateRange!.from!, 'yyyy-MM-dd')} to ${format(tardyDateRange!.to!, 'yyyy-MM-dd')}.xlsx`);
    };
    
    // --- WFH Certification Functions ---
    const generateWfhCertificationData = (): WfhCertRowData[] | null => {
        if (!wfhCertDateRange || !wfhCertDateRange.from || !wfhCertDateRange.to) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a month for the report.' });
            return null;
        }
    
        const daysInInterval = eachDayOfInterval({ start: wfhCertDateRange.from, end: wfhCertDateRange.to });
        const rows: WfhCertRowData[] = [];
    
        daysInInterval.forEach(day => {
            if (getMonth(day) !== getMonth(wfhCertDateRange.from!)) {
                return;
            }

            const shift = shifts.find(s => s.employeeId === currentUser.id && isSameDay(new Date(s.date), day));
            const leaveEntry = leave.find(l => l.employeeId === currentUser.id && isSameDay(new Date(l.date), day));
    
            let attendanceRendered = '';
            let totalHrs: string | number = '';
            let remarks = '';
            let includeRow = false;
    
            if (leaveEntry) {
                attendanceRendered = 'ONLEAVE';
                remarks = leaveEntry.type;
                includeRow = true;
            } else if (shift) {
                if (shift.isDayOff || shift.isHolidayOff) {
                    // Do not include row for day off/holiday off
                } else {
                    const shiftLabel = shift.label?.trim().toUpperCase();
                    attendanceRendered = (shiftLabel === 'WORK FROM HOME' || shiftLabel === 'WFH') ? 'WFH' : 'OFFICE-BASED';
                    includeRow = true;
                    
                    if (shift.startTime && shift.endTime) {
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
                        totalHrs = (diff - breakHours).toFixed(2);
                    }
                }
            }
    
            if (includeRow) {
                rows.push({
                    DATE: format(day, 'MM/dd/yyyy'),
                    ATTENDANCE_RENDERED: attendanceRendered,
                    TOTAL_HRS_SPENT: totalHrs,
                    REMARKS: remarks
                });
            }
        });
        
        return rows.sort((a, b) => new Date(a.DATE).getTime() - new Date(b.DATE).getTime());
    };

    const handleDownloadWfhCertification = async (data: WfhCertRowData[] | null) => {
        if (!data) return;
        if (!wfhCertTemplate) {
            toast({ variant: 'destructive', title: 'No Template', description: 'Please upload a WFH Certification template first.' });
            return;
        }
        if (!wfhCertDateRange || !wfhCertDateRange.from) {
            toast({ variant: 'destructive', title: 'No Date Range', description: 'Please select a month.' });
            return;
        }
    
        try {
            const workbook = new ExcelJS.Workbook();
            const buffer = Buffer.from(wfhCertTemplate, 'binary');
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) throw new Error("Template worksheet not found.");
    
            const manager = employees.find(e => e.id === currentUser.reportsTo);
    
            // Global placeholders
            worksheet.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    if (cell.value && typeof cell.value === 'string') {
                        let text = cell.value;
                        text = text.replace(/{{first_day_of_month}}/g, format(startOfMonth(wfhCertDateRange.from!), 'MMMM d, yyyy'));
                        text = text.replace(/{{last_day_of_month}}/g, format(endOfMonth(wfhCertDateRange.from!), 'MMMM d, yyyy'));
                        text = text.replace(/{{employee_name}}/g, getFullName(currentUser));
                        text = text.replace(/{{reports_to_manager}}/g, manager ? getFullName(manager) : 'N/A');
                        cell.value = text;
                    }
                });
            });
    
            const templateRowNumber = 9;
            const templateRow = worksheet.getRow(templateRowNumber);
            if (!templateRow.values.some(v => typeof v === 'string' && v.includes('{{DATE}}'))) {
                 throw new Error("Template row with placeholder `{{DATE}}` not found on row 9.");
            }

            const dataToInsert = data.map(d => [d.DATE, d.ATTENDANCE_RENDERED, d.TOTAL_HRS_SPENT, d.REMARKS]);
            worksheet.spliceRows(templateRowNumber, 1, ...dataToInsert);

            for (let i = 0; i < data.length; i++) {
                const newRow = worksheet.getRow(templateRowNumber + i);
                newRow.height = templateRow.height;
                templateRow.eachCell({ includeEmpty: true }, (templateCell, colNumber) => {
                    newRow.getCell(colNumber).style = templateCell.style;
                });
            }

            let sigRowNumber = -1;
            let sigColNumber = -1;
            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                    if (typeof cell.value === 'string' && cell.value.includes('{{employee_signature}}')) {
                        sigRowNumber = rowNumber;
                        sigColNumber = colNumber;
                        cell.value = ''; // Clear placeholder
                    }
                });
            });

            if (currentUser.signature && sigRowNumber !== -1 && sigColNumber !== -1) {
                const signatureImageId = workbook.addImage({
                    base64: currentUser.signature.split(',')[1],
                    extension: 'png',
                });
                worksheet.addImage(signatureImageId, {
                    tl: { col: sigColNumber - 1, row: sigRowNumber - 1 },
                    ext: { width: 100, height: 40 }
                });
            }
    
            const uint8Array = await workbook.xlsx.writeBuffer();
            const blob = new Blob([uint8Array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            saveAs(blob, `WFH Certification - ${getFullName(currentUser)} - ${format(wfhCertDateRange.from!, 'MMMM yyyy')}.xlsx`);
    
        } catch(error) {
            console.error("Error generating WFH cert:", error);
            toast({ variant: 'destructive', title: 'Report Generation Failed', description: (error as Error).message });
        }
    };
    
    // --- Event Handlers ---
    
    const handleViewReport = (type: 'workSchedule' | 'attendance' | 'userSummary' | 'tardy' | 'wfh') => {
        let data: ReportData | null = null;
        let title = '';
        let generator: (() => Promise<void>) | null = null;

        if (type === 'workSchedule') {
            const rawData = generateWorkScheduleData();
            data = generateWorkSchedulePreviewData(rawData);
            if (data) {
                title = `Regular Work Schedule (${format(workScheduleDateRange!.from!, 'LLL d')} - ${format(workScheduleDateRange!.to!, 'LLL d, y')})`;
                generator = () => handleDownloadWorkSchedule(rawData);
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
        } else if (type === 'tardy') {
            data = generateTardyReportData();
            if (data) {
                title = `Cumulative Tardy Report (${format(tardyDateRange!.from!, 'LLL d')} - ${format(tardyDateRange!.to!, 'LLL d, y')})`;
                generator = () => handleDownloadTardyReport(data);
            }
        } else if (type === 'wfh') {
            const rawData = generateWfhCertificationData();
            if (rawData) {
                const previewRows = rawData.map(d => [d.DATE, d.ATTENDANCE_RENDERED, d.TOTAL_HRS_SPENT, d.REMARKS]);
                data = {
                    headers: ['DATE', 'ATTENDANCE_RENDERED', 'TOTAL_HRS_SPENT', 'REMARKS'],
                    rows: previewRows,
                }
                title = `WFH Certification - ${getFullName(currentUser)} (${format(wfhCertDateRange!.from!, 'MMMM yyyy')})`;
                generator = () => handleDownloadWfhCertification(rawData);
            }
        }
        
        if (data) {
            setPreviewData(data);
            setReportTitle(title);
            setReportGenerator(() => generator);
            setIsPreviewOpen(true);
        }
    }

    const handleDirectDownload = (type: 'workSchedule' | 'attendance' | 'userSummary' | 'tardy' | 'wfh') => {
        if (type === 'workSchedule') {
            handleDownloadWorkSchedule(generateWorkScheduleData());
        } else if (type === 'attendance') {
            handleDownloadAttendanceSheet(generateAttendanceSheetData());
        } else if (type === 'userSummary') {
            handleDownloadUserSummary(generateUserSummaryData());
        } else if (type === 'tardy') {
            handleDownloadTardyReport(generateTardyReportData());
        } else if (type === 'wfh') {
            handleDownloadWfhCertification(generateWfhCertificationData());
        }
    };
    
    const setSemiMonthlyRange = (period: 'first-half' | 'second-half', monthOffset: 0 | -1) => {
        const today = new Date();
        const targetMonth = addMonths(today, monthOffset);
        const year = targetMonth.getFullYear();
        const month = targetMonth.getMonth();
        
        let from: Date;
        let to: Date;
        
        if (period === 'first-half') {
            from = new Date(year, month, 1);
            to = new Date(year, month, 15);
        } else { // second-half
            from = new Date(year, month, 16);
            to = endOfMonth(targetMonth);
        }
        
        setWorkScheduleDateRange({ from, to });
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
                    {isManager && (
                        <>
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
                                        <PopoverContent className="w-auto p-0 flex" align="start">
                                            <div className="flex flex-col space-y-2 p-4 border-r">
                                                <h4 className="font-medium text-sm">Presets</h4>
                                                <Button variant="ghost" className="justify-start" onClick={() => setSemiMonthlyRange('first-half', 0)}>This Month (1-15)</Button>
                                                <Button variant="ghost" className="justify-start" onClick={() => setSemiMonthlyRange('second-half', 0)}>This Month (16-EOM)</Button>
                                                <Button variant="ghost" className="justify-start" onClick={() => setSemiMonthlyRange('first-half', -1)}>Last Month (1-15)</Button>
                                                <Button variant="ghost" className="justify-start" onClick={() => setSemiMonthlyRange('second-half', -1)}>Last Month (16-EOM)</Button>
                                            </div>
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
                            
                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-2">Cumulative Tardy Report</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Combines tardiness data from leave requests and manual CSV uploads.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            id="tardy-date"
                                            variant={"outline"}
                                            className={cn(
                                            "w-full sm:w-[300px] justify-start text-left font-normal",
                                            !tardyDateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {tardyDateRange?.from ? (
                                            tardyDateRange.to ? (
                                                <>
                                                {format(tardyDateRange.from, "LLL dd, y")} -{" "}
                                                {format(tardyDateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(tardyDateRange.from, "LLL dd, y")
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
                                            defaultMonth={tardyDateRange?.from}
                                            selected={tardyDateRange}
                                            onSelect={setTardyDateRange}
                                            numberOfMonths={2}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="outline" onClick={() => setIsTardyImporterOpen(true)}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import Tardy Data
                                    </Button>
                                </div>
                                <CardFooter className="px-0 pt-6 pb-0 flex gap-2">
                                    <Button onClick={() => handleViewReport('tardy')} disabled={!tardyDateRange}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Report
                                    </Button>
                                    <Button onClick={() => handleDirectDownload('tardy')} disabled={!tardyDateRange}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Generate & Download
                                    </Button>
                                </CardFooter>
                            </Card>
                        </>
                    )}

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-2">Work From Home Certification</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Generate a WFH certification for the current user for a specific month.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="wfh-cert-date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !wfhCertMonth && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {wfhCertMonth ? format(wfhCertMonth, "MMMM yyyy") : <span>Pick a month</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="single"
                                    selected={wfhCertMonth}
                                    onSelect={setWfhCertMonth}
                                    captionLayout="dropdown-buttons"
                                    fromYear={2020}
                                    toYear={new Date().getFullYear() + 1}
                                />
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={() => setIsWfhCertUploaderOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Template
                            </Button>
                        </div>
                        <CardFooter className="px-0 pt-6 pb-0 flex gap-2">
                            <Button onClick={() => handleViewReport('wfh')} disabled={!wfhCertMonth}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Report
                            </Button>
                            <Button onClick={() => handleDirectDownload('wfh')} disabled={!wfhCertMonth || !wfhCertTemplate}>
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
            <WfhCertificationTemplateUploader
                isOpen={isWfhCertUploaderOpen}
                setIsOpen={setIsWfhCertUploaderOpen}
                onTemplateUpload={setWfhCertTemplate}
            />
             <TardyImporter
                isOpen={isTardyImporterOpen}
                setIsOpen={setIsTardyImporterOpen}
                onImport={(data) => {
                    setTardyRecords(data)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('tardyRecords', JSON.stringify(data));
                    }
                }}
                employees={employees}
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
