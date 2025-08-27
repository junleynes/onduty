
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Manager: 'default',
  Chef: 'destructive',
  Barista: 'secondary',
  Cashier: 'outline',
};

type TeamViewProps = {
    employees: Employee[];
    currentUser: Employee | null;
    onEditMember: (employee: Employee) => void;
};

export default function TeamView({ employees, currentUser, onEditMember }: TeamViewProps) {
  const isReadOnly = currentUser?.role === 'member';

  const groupedEmployees = useMemo(() => {
    return employees.reduce((acc, employee) => {
      const group = employee.department || 'Unassigned';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(employee);
      return acc;
    }, {} as Record<string, Employee[]>);
  }, [employees]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View your team members and their roles.
              </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={Object.keys(groupedEmployees)} className="w-full">
            {Object.entries(groupedEmployees).map(([department, members]) => (
                <AccordionItem key={department} value={department}>
                    <AccordionTrigger className="text-lg font-semibold">
                        {department} ({members.length})
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Contact</TableHead>
                                {!isReadOnly && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {members.map(employee => (
                                <TableRow key={employee.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={employee.avatar} data-ai-hint="profile avatar" />
                                        <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(employee)) }}>
                                        {getInitials(getFullName(employee))}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{getFullName(employee)}</p>
                                        <p className="text-sm text-muted-foreground">#{employee.employeeNumber}</p>
                                    </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={roleColors[employee.position] || 'default'}>{employee.position}</Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="capitalize">{employee.role}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <a href={`mailto:${employee.email}`} className="text-sm text-primary hover:underline">{employee.email}</a>
                                        <a href={`tel:${employee.phone}`} className="text-sm text-muted-foreground hover:underline">{employee.phone}</a>
                                    </div>
                                </TableCell>
                                {!isReadOnly && (
                                    <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">More Actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEditMember(employee)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </TableCell>
                                )}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
