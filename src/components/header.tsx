'use client';
import { LayoutGrid, Bell, CircleUser, User, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

type HeaderProps = {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
};

export default function Header({ currentRole, onRoleChange }: HeaderProps) {
  const { isMobile } = useSidebar();
  
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className={cn(isMobile ? "block" : "hidden")}/>
        <LayoutGrid className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-primary tracking-tight">ShiftMaster</h1>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial max-w-xs">
          <Select value={currentRole} onValueChange={(value: UserRole) => onRoleChange(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                {currentRole === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                <SelectValue placeholder="Select a view" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Admin View
                </div>
              </SelectItem>
              <SelectItem value="employee">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Employee View
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </div>
    </header>
  );
}