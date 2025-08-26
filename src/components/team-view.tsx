
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Upload, KeyRound } from 'lucide-react';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { TeamEditor } from './team-editor';
import { useToast } from '@/hooks/use-toast';
import { MemberImporter } from './member-importer';

const roleColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Manager: 'default',
  Chef: 'destructive',
  Barista: 'secondary',
  Cashier: 'outline',
};

type TeamViewProps = {
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    currentUser: Employee | null;
};

export default function TeamView({ employees, setEmployees, currentUser }: TeamViewProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const { toast } = useToast();
  
  const isReadOnly = currentUser?.role === 'member';

  const handleAddMember = () => {
    setEditingEmployee({});
    setIsPasswordResetMode(false);
    setIsEditorOpen(true);
  };

  const handleEditMember = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsPasswordResetMode(false);
    setIsEditorOpen(true);
  };
  
  const handleResetPassword = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsPasswordResetMode(true);
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
      toast({ title: isPasswordResetMode ? 'Password Reset Successfully' : 'Member Updated' });
    } else {
      // Add new employee
      const newEmployee: Employee = {
        ...employeeData,
        id: `emp-${Date.now()}`,
        avatar: employeeData.avatar || '',
        position: employeeData.position || '',
        role: employeeData.role || 'member',
      } as Employee;
      setEmployees([...employees, newEmployee]);
      toast({ title: 'Member Added' });
    }
  };
  
  const handleImportMembers = (newMembers: Partial<Employee>[]) => {
      const newEmployees: Employee[] = newMembers.map((member, index) => ({
        ...member,
        id: `emp-${Date.now()}-${index}`,
        avatar: member.avatar || '',
        position: member.position || '',
        role: 'member',
      } as Employee));

      setEmployees(prev => [...prev, ...newEmployees]);
      toast({ title: 'Import Successful', description: `${newEmployees.length} new members added.`})
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {isReadOnly ? "View your team members and their roles." : "Manage your team members and their roles."}
              </CardDescription>
          </div>
          {!isReadOnly && (
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsImporterOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import from CSV
                </Button>
                <Button onClick={handleAddMember}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Member
                </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
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
                              <DropdownMenuItem onClick={() => handleEditMember(employee)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                              </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleResetPassword(employee)}>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  <span>Reset Password</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteMember(employee.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
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
        isPasswordResetMode={isPasswordResetMode}
      />
      <MemberImporter
        isOpen={isImporterOpen}
        setIsOpen={setIsImporterOpen}
        onImport={handleImportMembers}
      />
    </>
  );
}
