
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
import { Separator } from './ui/separator';

const ALL_FEATURES: { key: NavItemKey; label: string, group: string }[] = [
  // Main Views
  { key: 'my-schedule', label: 'My Schedule', group: 'Main Views' },
  { key: 'my-tasks', label: 'My Tasks', group: 'Main Views' },
  { key: 'schedule', label: 'Schedule', group: 'Main Views' },
  { key: 'onduty', label: 'On Duty', group: 'Main Views' },
  { key: 'time-off', label: 'Time Off', group: 'Main Views' },
  { key: 'allowance', label: 'Mobile Load', group: 'Main Views' },
  { key: 'task-manager', label: 'Task Manager', group: 'Main Views' },
  { key: 'team', label: 'Team', group: 'Main Views' },
  { key: 'org-chart', label: 'Org Chart', group: 'Main Views' },
  { key: 'celebrations', label: 'Celebrations', group: 'Main Views' },
  { key: 'holidays', label: 'Holidays', group: 'Main Views' },
  // Reports Access
  { key: 'reports', label: 'Reports Page Access', group: 'Reports' },
  { key: 'report-work-schedule', label: 'Work Schedule Report', group: 'Reports' },
  { key: 'report-attendance', label: 'Attendance Sheet Report', group: 'Reports' },
  { key: 'report-work-extension', label: 'Work Extension Report', group: 'Reports' },
  { key: 'report-user-summary', label: 'User Summary Report', group: 'Reports' },
  { key: 'report-tardy', label: 'Tardy Report', group: 'Reports' },
  { key: 'report-wfh', label: 'WFH Certification', group: 'Reports' },
  // Admin
  { key: 'admin', label: 'Admin Panel', group: 'Admin' },
  { key: 'smtp-settings', label: 'SMTP Settings', group: 'Admin' },
  { key: 'permissions', label: 'Permissions', group: 'Admin' },
];

const ROLES: UserRole[] = ['admin', 'manager', 'member'];

const groupedFeatures = ALL_FEATURES.reduce((acc, feature) => {
    if (!acc[feature.group]) {
        acc[feature.group] = [];
    }
    acc[feature.group].push(feature);
    return acc;
}, {} as Record<string, typeof ALL_FEATURES>);

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
            Control which sections and features each user role can access. Admins always have full access.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[250px]">Feature</TableHead>
                {ROLES.map(role => (
                  <TableHead key={role} className="text-center capitalize">{role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedFeatures).map(([groupName, features], index) => (
                <React.Fragment key={groupName}>
                    <TableRow>
                        <TableCell colSpan={ROLES.length + 1} className="font-semibold bg-muted/50 py-2">
                            {groupName}
                        </TableCell>
                    </TableRow>
                    {features.map(({ key, label }) => (
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
                </React.Fragment>
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
