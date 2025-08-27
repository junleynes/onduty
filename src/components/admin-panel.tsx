
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee, UserRole } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreHorizontal, Pencil, PlusCircle, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AdminPanelProps = {
  users: Employee[];
  setUsers: React.Dispatch<React.SetStateAction<Employee[]>>;
  onAddMember: () => void;
  onEditMember: (employee: Employee) => void;
  onDeleteMember: (employeeId: string) => void;
  onImportMembers: () => void;
};

export default function AdminPanel({ users, setUsers, onAddMember, onEditMember, onDeleteMember, onImportMembers }: AdminPanelProps) {
  const { toast } = useToast();
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
    toast({ title: 'User Role Updated' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>Manage users, roles, and group assignments.</CardDescription>
        </div>
         <div className="flex gap-2">
            <Button variant="outline" onClick={onImportMembers}>
                <Upload className="h-4 w-4 mr-2" />
                Import Users
            </Button>
            <Button onClick={onAddMember}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add User
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar} data-ai-hint="profile avatar" />
                      <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(user)) }}>
                        {getInitials(getFullName(user))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getFullName(user)}</p>
                      <p className="text-sm text-muted-foreground">{user.position}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                    <a href={`mailto:${user.email}`} className="text-sm text-primary hover:underline">{user.email}</a>
                </TableCell>
                <TableCell>
                    <span className="font-medium">{user.department}</span>
                </TableCell>
                <TableCell>
                    <Select
                        value={user.role}
                        onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                    >
                        <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <DropdownMenuItem onClick={() => onEditMember(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDeleteMember(user.id)}>
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
  );
}
