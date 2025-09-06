
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from './ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { RolePermissions, UserRole, NavItemKey } from '@/types';
import { ScrollArea } from './ui/scroll-area';

const ALL_FEATURES: { key: NavItemKey; label: string }[] = [
  { key: 'my-schedule', label: 'My Schedule' },
  { key: 'my-tasks', label: 'My Tasks' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'onduty', label: 'On Duty' },
  { key: 'time-off', label: 'Time Off' },
  { key: 'allowance', label: 'Mobile Load' },
  { key: 'task-manager', label: 'Task Manager' },
  { key: 'team', label: 'Team' },
  { key: 'org-chart', label: 'Org Chart' },
  { key: 'celebrations', label: 'Celebrations' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'reports', label: 'Reports' },
  { key: 'admin', label: 'Admin Panel' },
  { key: 'smtp-settings', label: 'SMTP Settings' },
  { key: 'permissions', label: 'Permissions' },
];

const ROLES: UserRole[] = ['admin', 'manager', 'member'];

type PermissionsEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  permissions: RolePermissions;
  setPermissions: React.Dispatch<React.SetStateAction<RolePermissions>>;
};

export function PermissionsEditor({ isOpen, setIsOpen, permissions, setPermissions }: PermissionsEditorProps) {
  const { toast } = useToast();

  const handlePermissionChange = (role: UserRole, feature: NavItemKey, isChecked: boolean) => {
    setPermissions(prev => {
      const currentPermissions = new Set(prev[role] || []);
      if (isChecked) {
        currentPermissions.add(feature);
      } else {
        currentPermissions.delete(feature);
      }
      return {
        ...prev,
        [role]: Array.from(currentPermissions),
      };
    });
  };

  const handleSaveChanges = () => {
    // The useEffect in page.tsx will handle the actual saving
    toast({ title: 'Permissions Updated', description: 'Changes will be saved automatically.' });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Control which sections each user role can access. Admins always have full access.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[200px]">Feature</TableHead>
                {ROLES.map(role => (
                  <TableHead key={role} className="text-center capitalize">{role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALL_FEATURES.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{label}</TableCell>
                  {ROLES.map(role => (
                    <TableCell key={role} className="text-center">
                      <Checkbox
                        checked={permissions[role]?.includes(key)}
                        onCheckedChange={(checked) => handlePermissionChange(role, key, !!checked)}
                        disabled={role === 'admin'}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
