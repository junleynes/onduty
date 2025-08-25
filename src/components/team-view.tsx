'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { employees as initialEmployees } from '@/lib/data';
import type { Employee } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Phone, PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { TeamEditor } from './team-editor';
import { useToast } from '@/hooks/use-toast';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Manager: 'default',
  Chef: 'destructive',
  Barista: 'secondary',
  Cashier: 'outline',
};

export default function TeamView() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const { toast } = useToast();

  const handleAddMember = () => {
    setEditingEmployee({});
    setIsEditorOpen(true);
  };

  const handleEditMember = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditorOpen(true);
  };

  const handleDeleteMember = (employeeId: string) => {
    setEmployees(employees.filter(emp => emp.id !== employeeId));
    toast({ title: 'Team Member Removed', variant: 'destructive' });
  };

  const handleSaveMember = (employeeData: Partial<Employee>) => {
    if (employeeData.id) {
      // Update existing employee
      setEmployees(employees.map(emp => (emp.id === employeeData.id ? { ...emp, ...employeeData } as Employee : emp)));
      toast({ title: 'Member Updated' });
    } else {
      // Add new employee
      const newEmployee: Employee = {
        ...employeeData,
        id: `emp-${Date.now()}`,
        avatar: employeeData.avatar || '',
      } as Employee;
      setEmployees([...employees, newEmployee]);
      toast({ title: 'Member Added' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team members and their roles.</CardDescription>
          </div>
          <Button onClick={handleAddMember}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(employee => (
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
                      <div className="flex flex-col">
                        <a href={`mailto:${employee.email}`} className="text-sm text-primary hover:underline">{employee.email}</a>
                        <a href={`tel:${employee.phone}`} className="text-sm text-muted-foreground hover:underline">{employee.phone}</a>
                      </div>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMember(employee)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteMember(employee.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <TeamEditor
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        employee={editingEmployee}
        onSave={handleSaveMember}
      />
    </>
  );
}
