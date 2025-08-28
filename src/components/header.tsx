
'use client';
import { LayoutGrid, Bell, CircleUser, User, Shield, LogOut, KeyRound, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import type { Employee, Notification } from '@/types';
import { cn, getFullName, getInitials, getBackgroundColor } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

type HeaderProps = {
  currentUser: Employee | null;
  onLogout: () => void;
  onEditProfile: () => void;
  onResetPassword: () => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
};

export default function Header({ currentUser, onLogout, onEditProfile, onResetPassword, notifications, setNotifications }: HeaderProps) {
  const { isMobile } = useSidebar();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(current => current.map(n => n.id === id ? {...n, isRead: true} : n));
  };
  
  const markAllAsRead = () => {
    setNotifications(current => current.map(n => ({...n, isRead: true})));
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className={cn(isMobile ? "block" : "hidden md:flex")}/>
        <LayoutGrid className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-primary tracking-tight">ShiftMaster</h1>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-primary relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">{unreadCount}</Badge>
                      )}
                      <span className="sr-only">Toggle notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                        <>
                        <DropdownMenuGroup className="max-h-80 overflow-y-auto">
                        {notifications.map(notification => (
                            <DropdownMenuItem key={notification.id} onSelect={(e) => e.preventDefault()} onClick={() => markAsRead(notification.id)} className={cn(!notification.isRead && 'bg-accent/50')}>
                               <div className="flex flex-col w-full">
                                    <p className="text-sm">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                    </p>
                               </div>
                            </DropdownMenuItem>
                        ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={markAllAsRead}>
                            <Check className="mr-2 h-4 w-4" />
                            <span>Mark all as read</span>
                        </DropdownMenuItem>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-4">No new notifications</p>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-primary">
                        {currentUser ? (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser.avatar} data-ai-hint="profile avatar" />
                                <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(currentUser)) }}>
                                    {getInitials(getFullName(currentUser))}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                             <CircleUser className="h-5 w-5" />
                        )}
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEditProfile}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
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
