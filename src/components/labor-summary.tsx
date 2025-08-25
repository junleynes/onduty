
'use client';
import React from 'react';
import { Progress } from '@/components/ui/progress';
import type { Shift, Employee } from '@/types';

interface LaborSummaryProps {
  shifts: Shift[];
  employees: Employee[];
}

export function LaborSummary({ shifts, employees }: LaborSummaryProps) {
  const totalHours = shifts.reduce((acc, shift) => {
    if (!shift.startTime || !shift.endTime) return acc;
    const start = parseInt(shift.startTime.split(':')[0]);
    const end = parseInt(shift.endTime.split(':')[0]);
    return acc + (end - start);
  }, 0);

  const totalShifts = shifts.length;
  const totalUsers = new Set(shifts.map(s => s.employeeId)).size;

  return (
    <div className="sticky bottom-0 z-10 mt-auto border-t bg-card p-4">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Hours</div>
            <div className="text-2xl font-bold">{totalHours.toFixed(2)}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-sm text-muted-foreground">Shifts</div>
            <div className="text-2xl font-bold">{totalShifts}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-sm text-muted-foreground">Users</div>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-64">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Labor Cost</span>
              <span className="text-muted-foreground">$0.00</span>
            </div>
            <Progress value={0} className="mt-1 h-2" />
          </div>
          <div className="w-64">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Sales</span>
              <span className="text-muted-foreground">$0.00</span>
            </div>
            <Progress value={0} className="mt-1 h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
