
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee, SmtpSettings, UserRole } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { MoreHorizontal, Pencil, PlusCircle, Trash2, Upload, Users, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { sendActivationLink } from '@/app/actions';

type AdminPanelProps = {
  users: Employee[];
  setUsers: React.Dispatch<React.SetStateAction<Employee[]>>;
  groups: string[];
  onAddMember: () => void;
  onEditMember: (employee: Employee) => void;
  onDeleteMember: (employeeId: string) => void;
  onBatchDelete: (employeeIds: string[]) => void;
  onImportMembers: () => void;
  onManageGroups: () => void;
  smtpSettings: SmtpSettings;
};

export default function AdminPanel({ users, setUsers, groups, onAddMember, onEditMember, onDeleteMember, onBatchDelete, onImportMembers, onManageGroups, smtpSettings }: AdminPanelProps) {
  const { toast } = useToast();
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isSending, startSendingTransition] = useTransition();
  
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
    toast({ title: 'User Role Updated' });
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedRowIds(users.map(u => u.id));
    } else {
        setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
        setSelectedRowIds(prev => [...prev, id]);
    } else {
        setSelectedRowIds(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const numSelected = selectedRowIds.length;
  const rowCount = users.length;
  
  const handleBatchDelete = () => {
    onBatchDelete(selectedRowIds);
    setSelectedRowIds([]);
  }

  const handleSendActivation = (employeeId: string) => {
    startSendingTransition(async () => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const result = await sendActivationLink(employeeId, origin, smtpSettings);
      if (result.success) {
        toast({ title: 'Activation Link Sent', description: 'The user will receive an email to set their password.' });
      } else {
        toast({ variant: 'destructive', title: 'Failed to Send Link', description: result.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <CardTitle>Users and Groups</CardTitle>
            <CardDescription>Manage users, roles, and group assignments.</CardDescription>
        </div>
         <div className="flex gap-2 flex-wrap justify-start md:justify-end">
            {numSelected > 0 ? (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected ({numSelected})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {numSelected} user(s)
                            and all of their associated data from the servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBatchDelete}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : (
                <>
                    <Button variant="outline" onClick={onManageGroups}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Groups
                    </Button>
                    <Button variant="outline" onClick={onImportMembers}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Users
                    </Button>
                    <Button onClick={onAddMember}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead padding="checkbox">
                 <Checkbox
                    checked={numSelected > 0 && numSelected === rowCount}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Select all"
                  />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} data-state={selectedRowIds.includes(user.id) && "selected"}>
                 <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRowIds.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectRow(user.id, !!checked)}
                    aria-label="Select row"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar} data-ai-hint="profile avatar" />
                      <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(user)) }}>
                        {getInitials(getFullName(user))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getFullName(user)}</p>
                        {user.visibility?.schedule === false && <EyeOff className="h-4 w-4 text-muted-foreground" title="User is hidden in the app"/>}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.position}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                    <a href={`mailto:${user.email}`} className="text-sm text-primary hover:underline">{user.email}</a>
                </TableCell>
                <TableCell>
                    <span className="font-medium">{user.group}</span>
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
                            <DropdownMenuItem onClick={() => onEditMember(user, true)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                <span>Reset Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendActivation(user.id)} disabled={isSending}>
                                <Mail className="mr-2 h-4 w-4" />
                                <span>Send Activation Link</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
