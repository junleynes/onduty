
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Mail, Phone, CalendarDays, Award, Download, UserCheck, Cake } from 'lucide-react';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';

type TeamViewProps = {
    employees: Employee[];
    currentUser: Employee | null;
    onEditMember: (employee: Employee, isPasswordReset?: boolean) => void;
};

const calculateTenure = (startDate: Date | undefined): string => {
    if (!startDate) return 'N/A';
    const now = new Date();
    const years = differenceInYears(now, startDate);
    const months = differenceInMonths(now, startDate) % 12;
    
    let tenure = '';
    if (years > 0) {
        tenure += `${years} year${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
        if (tenure) tenure += ', ';
        tenure += `${months} month${months > 1 ? 's' : ''}`;
    }
    if (!tenure) {
        const days = differenceInDays(now, startDate);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
    return tenure;
};

export default function TeamView({ employees, currentUser, onEditMember }: TeamViewProps) {
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const { toast } = useToast();

  const handleDownloadExcel = async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Team Members');

        worksheet.columns = [
            { header: 'ID Number', key: 'employeeNumber', width: 20 },
            { header: 'Employee Number', key: 'personnelNumber', width: 20 },
            { header: 'Last Name', key: 'lastName', width: 20 },
            { header: 'First Name', key: 'firstName', width: 20 },
            { header: 'M.I.', key: 'middleInitial', width: 10 },
            { header: 'Position', key: 'position', width: 30 },
            { header: 'Group', key: 'group', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Start Date', key: 'startDate', width: 15 },
            { header: 'Last Promotion', key: 'lastPromotionDate', width: 15 },
        ];
        
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };

        employees.forEach(employee => {
            worksheet.addRow({
                ...employee,
                startDate: employee.startDate ? format(new Date(employee.startDate), 'yyyy-MM-dd') : '',
                lastPromotionDate: employee.lastPromotionDate ? format(new Date(employee.lastPromotionDate), 'yyyy-MM-dd') : '',
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Team Members - ${currentUser?.group || 'Export'}.xlsx`);

        toast({ title: 'Export Successful', description: 'Team member list downloaded.' });

    } catch (error) {
        console.error('Failed to download Excel file:', error);
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: 'Could not generate the Excel file.',
        });
    }
  };

  const groupedEmployees = React.useMemo(() => {
    if (!currentUser || !currentUser.group) {
        return {};
    }
    return employees
      .filter(employee => employee.group === currentUser.group)
      .reduce((acc, employee) => {
        const group = employee.group || 'Unassigned';
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(employee);
        return acc;
    }, {} as Record<string, Employee[]>);
  }, [employees, currentUser]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View your team members and their roles.
              </CardDescription>
          </div>
          <Button variant="outline" onClick={handleDownloadExcel}>
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={Object.keys(groupedEmployees)} className="w-full space-y-4">
            {Object.entries(groupedEmployees).map(([group, members]) => (
                <Card key={group} className="overflow-hidden bg-card">
                    <AccordionItem value={group} className="border-b-0">
                        <AccordionTrigger className="text-lg font-semibold bg-muted/50 px-6 py-4 hover:no-underline">
                            {group} ({members.length})
                        </AccordionTrigger>
                        <AccordionContent className="p-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {members.map(employee => (
                                    <Card key={employee.id} className="shadow-md bg-background">
                                        <CardContent className="p-4 flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-16 w-16 border-2 border-primary">
                                                    <AvatarImage src={employee.avatar} data-ai-hint="profile avatar" />
                                                    <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(employee)) }} className="text-xl">
                                                        {getInitials(getFullName(employee))}
                                                    </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                    <p className="font-bold text-lg">{getFullName(employee)}</p>
                                                    <p className="text-muted-foreground">{employee.position}</p>
                                                    </div>
                                                </div>
                                                {isManager && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">More Actions</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => onEditMember(employee, false)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                <span>Edit</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" /> 
                                                    <a href={`mailto:${employee.email}`} className="text-primary hover:underline">{employee.email}</a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" /> 
                                                    <a href={`tel:${employee.phone}`} className="hover:underline">{employee.phone}</a>
                                                </div>
                                                 {employee.birthDate && (
                                                    <div className="flex items-center gap-2">
                                                        <Cake className="h-4 w-4 text-muted-foreground" />
                                                        <span>{format(new Date(employee.birthDate), 'MMMM d')}</span>
                                                    </div>
                                                )}
                                                {employee.startDate && (
                                                  <>
                                                    <div className="flex items-center gap-2">
                                                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                      <span>Started: {format(new Date(employee.startDate), 'MMM d, yyyy')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                                                        <span>Tenure: {calculateTenure(new Date(employee.startDate))}</span>
                                                    </div>
                                                  </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            ))}
             {Object.keys(groupedEmployees).length === 0 && (
                 <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>No team members found in your assigned group.</p>
                    <p className="text-sm">Please contact an administrator to be assigned to a group.</p>
                 </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
