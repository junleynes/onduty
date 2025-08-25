
'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { Shift, Leave } from '@/types';
import { cn } from '@/lib/utils';
import { getEmployeeById } from '@/lib/data';

const blockVariants = cva(
  'w-full p-2 rounded-md text-left text-white overflow-hidden cursor-pointer',
  {
    variants: {
      type: {
        shift: '',
        leave: 'bg-destructive/80 border-destructive',
        dayOff: 'bg-gray-400/80 border-gray-500 text-center',
      },
    },
    defaultVariants: {
      type: 'shift',
    },
  }
);

interface ShiftBlockProps extends VariantProps<typeof blockVariants> {
  item: Shift | Leave;
  onClick: () => void;
}

const leaveColors: { [key: string]: string } = {
    'Vacation': 'bg-pink-500/80',
    'Emergency': 'bg-red-600/80',
    'Unavailable': 'bg-gray-500/80',
    'Time Off Request': 'bg-orange-500/80',
};

function isLeave(item: Shift | Leave): item is Leave {
  return 'type' in item;
}

export function ShiftBlock({ item, onClick }: ShiftBlockProps) {
  if (isLeave(item)) {
    const employee = getEmployeeById(item.employeeId);
    if (!employee) return null;
    return (
      <div
        onClick={onClick}
        className={cn(blockVariants({ type: 'leave' }), leaveColors[item.type])}
      >
        <p className="font-bold text-xs truncate">{item.type}</p>
        <p className="text-xs truncate">{employee.name}</p>
        {!item.isAllDay && <p className="text-xs truncate">{item.startTime} - {item.endTime}</p>}
      </div>
    );
  }

  const shift = item;

  if (shift.isDayOff) {
    return (
       <div
        onClick={onClick}
        className={cn(blockVariants({ type: 'dayOff' }))}
      >
        <p className="font-bold text-xs truncate">DAY OFF</p>
      </div>
    )
  }

  const employee = shift.employeeId ? getEmployeeById(shift.employeeId) : null;
  const role = employee?.role;

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'p' : 'a';
    const hour12 = hour % 12 || 12;
    return `${hour12}${m === '00' ? '' : `:${m}`}${suffix}`;
  };

  return (
    <div
      onClick={onClick}
      className={cn(blockVariants({ type: 'shift' }))}
      style={{ backgroundColor: shift.color }}
    >
      <p className="font-bold text-xs truncate">
        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
      </p>
      {role && <p className="text-xs opacity-80 truncate">{role} &gt;</p>}
      <p className="text-sm truncate">{shift.label}</p>
    </div>
  );
}
