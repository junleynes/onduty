
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Mail, Phone } from 'lucide-react';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type TeamViewProps = {
    employees: Employee[];
    currentUser: Employee | null;
    onEditMember: (employee: Employee) => void;
};

export default function TeamView({ employees, currentUser, onEditMember }: TeamViewProps) {
  const isReadOnly = currentUser?.role === 'member';

  const groupedEmployees = React.useMemo(() => {
    return employees.reduce((acc, employee) => {
      const group = employee.group || 'Unassigned';
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
          <Accordion type="multiple" defaultValue={Object.keys(groupedEmployees)} className="w-full space-y-4">
            {Object.entries(groupedEmployees).map(([group, members]) => (
                <Card key={group} className="overflow-hidden">
                    <AccordionItem value={group} className="border-b-0">
                        <AccordionTrigger className="text-lg font-semibold bg-muted/50 px-6 py-4">
                            {group} ({members.length})
                        </AccordionTrigger>
                        <AccordionContent className="p-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {members.map(employee => (
                                    <Card key={employee.id} className="shadow-md">
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
                                                {!isReadOnly && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
