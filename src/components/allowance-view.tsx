
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Employee, CommunicationAllowance } from '@/types';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AllowanceViewProps = {
  employees: Employee[];
  allowances: CommunicationAllowance[];
  setAllowances: React.Dispatch<React.SetStateAction<CommunicationAllowance[]>>;
  currentUser: Employee;
};

export default function AllowanceView({ employees, allowances, setAllowances, currentUser }: AllowanceViewProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';
  const membersInGroup = employees.filter(e => e.group === currentUser.group);

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


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl font-bold text-center bg-purple-200 px-4 py-2 rounded-lg">
                    {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          <CardDescription>
            Monitor monthly communication allowances for your team.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-100">
              <TableHead className="font-bold text-black">Recipient</TableHead>
              <TableHead className="font-bold text-black">Load Allocation</TableHead>
              <TableHead className="font-bold text-black bg-yellow-200">Load Balance</TableHead>
              <TableHead className="font-bold text-black">150% Limit</TableHead>
              <TableHead className="font-bold text-black">Excess in Allocation</TableHead>
              <TableHead className="font-bold text-black">Will receive load?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersInGroup.map((employee) => {
              const allocation = employee.loadAllocation || 0;
              const limitPercentage = employee.loadLimitPercentage || 150;
              const balance = getEmployeeBalance(employee.id);
              const limit = allocation * (limitPercentage / 100);
              const excess = balance !== undefined && balance > allocation ? balance - allocation : 0;
              const willReceive = balance !== undefined ? balance <= allocation : true;

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
                  <TableCell className={cn(!willReceive && 'bg-red-200 text-black')}>
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
