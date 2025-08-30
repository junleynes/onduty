
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Employee, CommunicationAllowance } from '@/types';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Settings } from 'lucide-react';
import { cn, getInitialState } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';
  const membersInGroup = isManager 
    ? employees.filter(e => e.group === currentUser.group)
    : employees.filter(e => e.id === currentUser.id);


  const handleBalanceChange = (employeeId: string, newBalance: string) => {
    const balanceValue = parseFloat(newBalance);
    if (isNaN(balanceValue)) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    setAllowances(prev => {
      const existingIndex = prev.findIndex(a => a.employeeId === employeeId && a.year === year && a.month === month);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].balance = balanceValue;
        return updated;
      } else {
        const newAllowance: CommunicationAllowance = {
          id: `ca-${employeeId}-${year}-${month}`,
          employeeId,
          year,
          month,
          balance: balanceValue,
        };
        return [...prev, newAllowance];
      }
    });
  };
  
  const getEmployeeBalance = (employeeId: string): number | undefined => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const allowance = allowances.find(a => a.employeeId === employeeId && a.year === year && a.month === month);
    return allowance?.balance;
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };
  
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
          setLoadLimitPercentage(value);
      }
  }

  const handleSaveSettings = () => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('globalLoadLimit', JSON.stringify(loadLimitPercentage));
      }
      toast({ title: "Global limit updated." });
      setIsSettingsOpen(false);
  }

  const handleDownloadReport = () => {
    const dataForReport = membersInGroup.map(employee => {
        const allocation = employee.loadAllocation || 0;
        const balance = getEmployeeBalance(employee.id);
        const limit = allocation * (loadLimitPercentage / 100);
        const excess = balance !== undefined && balance > allocation ? balance - allocation : 0;
        const willReceive = balance !== undefined ? balance <= allocation : true;
        
        return {
            "Recipient": `${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase(),
            "Load Allocation": allocation.toFixed(2),
            "Load Balance": balance !== undefined ? balance.toFixed(2) : 'N/A',
            "Limit": limit.toFixed(2),
            "Excess in Allocation": excess > 0 ? excess.toFixed(2) : '',
            "Will receive load?": balance !== undefined ? (willReceive ? 'Yes' : 'No') : 'Yes'
        };
    });

    const ws = XLSX.utils.json_to_sheet(dataForReport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Allowance Report");
    XLSX.writeFile(wb, `Allowance Report - ${format(currentDate, 'MMMM yyyy')}.xlsx`);

    toast({ title: 'Report Downloaded', description: 'The allowance report has been saved as an Excel file.' });
  };


  return (
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
                            Set the global load limit percentage for all team members.
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
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
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
              <TableHead>Limit ({loadLimitPercentage}%)</TableHead>
              <TableHead>Excess in Allocation</TableHead>
              <TableHead>Will receive load?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersInGroup.map((employee) => {
              const allocation = employee.loadAllocation || 0;
              const balance = getEmployeeBalance(employee.id);
              const limit = allocation * (loadLimitPercentage / 100);
              const excess = balance !== undefined && balance > allocation ? balance - allocation : 0;
              const willReceive = balance !== undefined ? balance <= limit : true;

              return (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{`${employee.lastName}, ${employee.firstName} ${employee.middleInitial || ''}`.toUpperCase()}</TableCell>
                  <TableCell>{allocation.toFixed(2)}</TableCell>
                  <TableCell>
                    {isManager ? (
                        <span>{balance !== undefined ? balance.toFixed(2) : 'N/A'}</span>
                    ) : (
                         <Input
                            type="number"
                            step="0.01"
                            value={balance ?? ''}
                            onChange={(e) => handleBalanceChange(employee.id, e.target.value)}
                            className="w-32"
                            placeholder="Enter balance"
                         />
                    )}
                  </TableCell>
                  <TableCell>{limit.toFixed(2)}</TableCell>
                  <TableCell>{excess > 0 ? excess.toFixed(2) : ''}</TableCell>
                  <TableCell className={cn(!willReceive && 'bg-red-200 text-black font-bold')}>
                    {balance !== undefined ? (willReceive ? 'Yes' : 'No') : 'Yes'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
