
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Employee, CommunicationAllowance } from '@/types';
import { format, subMonths, addMonths, isSameMonth, getDate, isFuture, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Settings, Pencil } from 'lucide-react';
import { cn, getInitialState } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from './ui/date-picker';

type AllowanceViewProps = {
  employees: Employee[];
  allowances: CommunicationAllowance[];
  setAllowances: React.Dispatch<React.SetStateAction<CommunicationAllowance[]>>;
  currentUser: Employee;
};

export default function AllowanceView({ employees, allowances, setAllowances, currentUser }: AllowanceViewProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadLimitPercentage, setLoadLimitPercentage] = useState<number>(() => getInitialState('globalLoadLimit', 150));
  const [editableStartDay, setEditableStartDay] = useState<number>(() => getInitialState('editableStartDay', 15));
  const [editableEndDay, setEditableEndDay] = useState<number>(() => getInitialState('editableEndDay', 20));
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBalanceEditorOpen, setIsBalanceEditorOpen] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<Partial<CommunicationAllowance> | null>(null);
  
  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';
  
  const getEmployeeAllowance = (employeeId: string): CommunicationAllowance | undefined => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return allowances.find(a => a.employeeId === employeeId && a.year === year && a.month === month);
  }

  const membersInGroup = React.useMemo(() => {
    const allMembersInGroup = employees.filter(e => e.group === currentUser.group);
    if (isManager) {
        return allMembersInGroup;
    }
    return allMembersInGroup.filter(employee => {
        // Always include the current user
        if (employee.id === currentUser.id) return true;
        // Include other members only if they have an allowance entry for the current month
        const allowance = getEmployeeAllowance(employee.id);
        return allowance && allowance.balance !== undefined && allowance.balance !== null;
    });
  }, [employees, currentUser, isManager, allowances, currentDate]);


  const handleOpenBalanceEditor = (employeeId: string) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const existingAllowance = getEmployeeAllowance(employeeId);
    setEditingAllowance(existingAllowance || { employeeId, year, month });
    setIsBalanceEditorOpen(true);
  }

  const handleSaveBalance = () => {
    if (!editingAllowance) return;
    
    setAllowances(prev => {
        const existingIndex = prev.findIndex(a => a.id === editingAllowance.id || (a.employeeId === editingAllowance.employeeId && a.year === editingAllowance.year && a.month === editingAllowance.month));
        if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...editingAllowance } as CommunicationAllowance;
            return updated;
        } else {
            const newAllowance: CommunicationAllowance = {
                id: `ca-${editingAllowance.employeeId}-${editingAllowance.year}-${editingAllowance.month}`,
                balance: 0,
                ...editingAllowance,
            } as CommunicationAllowance;
            return [...prev, newAllowance];
        }
    });
    toast({ title: 'Balance Updated'});
    setIsBalanceEditorOpen(false);
    setEditingAllowance(null);
  };
  

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };
  
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
          setLoadLimitPercentage(value);
      }
  }
  
  const handleStartDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 31) {
          setEditableStartDay(value);
      }
  }

  const handleEndDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 31) {
          setEditableEndDay(value);
      }
  }

  const handleSaveSettings = () => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('globalLoadLimit', JSON.stringify(loadLimitPercentage));
          localStorage.setItem('editableStartDay', JSON.stringify(editableStartDay));
          localStorage.setItem('editableEndDay', JSON.stringify(editableEndDay));
      }
      toast({ title: "Global settings updated." });
      setIsSettingsOpen(false);
  }

  const handleDownloadReport = () => {
    const dataForReport = membersInGroup.map(employee => {
        const allocation = employee.loadAllocation || 0;
        const allowance = getEmployeeAllowance(employee.id);
        const balance = allowance?.balance;
        const limit = allocation * (loadLimitPercentage / 100);
        const excess = balance !== undefined && balance > allocation ? balance - allocation : 0;
        
        let willReceiveText = '';
        if (balance !== undefined) {
            willReceiveText = balance <= limit ? 'Yes' : 'No';
        }
        
        return {
            "Recipient": `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase(),
            "Load Allocation": allocation.toFixed(2),
            "Load Balance": balance !== undefined ? balance.toFixed(2) : 'N/A',
            "Balance as of": allowance?.asOfDate ? format(new Date(allowance.asOfDate), 'yyyy-MM-dd') : 'N/A',
            "Limit": limit.toFixed(2),
            "Excess in Allocation": excess > 0 ? excess.toFixed(2) : '',
            "Will receive load?": willReceiveText,
        };
    });

    const ws = XLSX.utils.json_to_sheet(dataForReport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Allowance Report");
    XLSX.writeFile(wb, `Allowance Report - ${format(currentDate, 'MMMM yyyy')}.xlsx`);

    toast({ title: 'Report Downloaded', description: 'The allowance report has been saved as an Excel file.' });
  };


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle>Communication Allowance</CardTitle>
            <CardDescription>
                Monitor monthly communication allowances for your team.
            </CardDescription>
          </div>
          {isManager && (
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleDownloadReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                </Button>
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Global Settings</DialogTitle>
                        <DialogDescription>
                            Set the global load limit and member editing window.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="loadLimit" className="text-right col-span-2">
                                Global Load Limit (%)
                                </Label>
                                <Input
                                    id="loadLimit"
                                    type="number"
                                    value={loadLimitPercentage}
                                    onChange={handleLimitChange}
                                    className="col-span-2"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right col-span-2">
                                    Editing Window (Day)
                                </Label>
                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                <Input
                                    id="startDay"
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="Start"
                                    value={editableStartDay}
                                    onChange={handleStartDayChange}
                                />
                                 <Input
                                    id="endDay"
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="End"
                                    value={editableEndDay}
                                    onChange={handleEndDayChange}
                                />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveSettings}>Save changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-bold text-center">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} disabled={!isManager && isFuture(startOfMonth(addMonths(currentDate, 1)))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Load Allocation</TableHead>
              <TableHead>Load Balance</TableHead>
              <TableHead>Balance as of</TableHead>
              <TableHead>Limit ({loadLimitPercentage}%)</TableHead>
              <TableHead>Excess in Allocation</TableHead>
              <TableHead>Will receive load?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersInGroup.map((employee) => {
              const allocation = employee.loadAllocation || 0;
              const allowance = getEmployeeAllowance(employee.id);
              const balance = allowance?.balance;
              const limit = allocation * (loadLimitPercentage / 100);
              const excess = balance !== undefined && balance > allocation ? balance - allocation : 0;
              
              const willReceive = balance !== undefined ? balance <= limit : undefined;
              
              const isCurrentUser = employee.id === currentUser.id;
              const isCurrentMonth = isSameMonth(currentDate, new Date());
              const today = new Date();
              const dayOfMonth = getDate(today);
              const isWithinEditingWindow = dayOfMonth >= editableStartDay && dayOfMonth <= editableEndDay;

              const canEdit = isManager || (isCurrentUser && isCurrentMonth && isWithinEditingWindow);

              return (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{`${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase()}</TableCell>
                  <TableCell>{allocation.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{balance !== undefined ? balance.toFixed(2) : 'N/A'}</span>
                        {canEdit && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenBalanceEditor(employee.id)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                  </TableCell>
                   <TableCell>
                      {allowance?.asOfDate ? format(new Date(allowance.asOfDate), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>{limit.toFixed(2)}</TableCell>
                  <TableCell>{excess > 0 ? excess.toFixed(2) : ''}</TableCell>
                  <TableCell className={cn(willReceive === false && 'bg-red-200 text-black font-bold')}>
                    {willReceive !== undefined ? (willReceive ? 'Yes' : 'No') : ''}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    
    <Dialog open={isBalanceEditorOpen} onOpenChange={setIsBalanceEditorOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update Load Balance</DialogTitle>
                <DialogDescription>
                    Enter the details for your current load balance for {format(currentDate, 'MMMM yyyy')}.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="balance">Load Balance</Label>
                    <Input 
                        id="balance"
                        type="number"
                        step="0.01"
                        value={editingAllowance?.balance ?? ''}
                        onChange={(e) => setEditingAllowance(prev => ({ ...prev, balance: parseFloat(e.target.value) }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Load balance as of</Label>
                    <DatePicker 
                        date={editingAllowance?.asOfDate ? new Date(editingAllowance.asOfDate) : undefined}
                        onDateChange={(date) => setEditingAllowance(prev => ({...prev, asOfDate: date}))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="screenshot">Screenshot (optional)</Label>
                    <Input 
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setEditingAllowance(prev => ({...prev, screenshot: reader.result as string}));
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsBalanceEditorOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveBalance}>Save</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
