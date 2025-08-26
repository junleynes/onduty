
'use client';
import { LayoutGrid, Bell, CircleUser, User, Shield, LogOut, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import type { Employee } from '@/types';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type HeaderProps = {
  currentUser: Employee | null;
  onLogout: () => void;
  onResetPassword: () => void;
};

export default function Header({ currentUser, onLogout, onResetPassword }: HeaderProps) {
  const { isMobile } = useSidebar();
  
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className={cn(isMobile ? "block" : "hidden md:flex")}/>
        <LayoutGrid className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-primary tracking-tight">ShiftMaster</h1>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full text-primary">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-primary">
                      <CircleUser className="h-5 w-5" />
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={onResetPassword}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Reset Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
