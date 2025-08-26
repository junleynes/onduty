
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee, UserRole } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type AdminPanelProps = {
  users: Employee[];
  setUsers: React.Dispatch<React.SetStateAction<Employee[]>>;
};

export default function AdminPanel({ users, setUsers }: AdminPanelProps) {
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>Manage user roles and permissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead className="w-[180px]">Change Role</TableHead>
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
                  <span className="capitalize font-medium">{user.role}</span>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
