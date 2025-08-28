
'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { Shift, Leave } from '@/types';
import { cn } from '@/lib/utils';
import { getEmployeeById } from '@/lib/data';

const blockVariants = cva(
  'w-full p-1.5 rounded-md text-left text-white overflow-hidden border relative',
  {
    variants: {
      type: {
        shift: 'text-black',
        leave: 'border-transparent',
        dayOff: 'bg-gray-400/80 border-gray-500 text-center',
      },
      interactive: {
        true: 'cursor-pointer',
        false: 'cursor-default',
      },
      context: {
        week: '',
        month: 'p-1',
      }
    },
    defaultVariants: {
      type: 'shift',
      interactive: true,
      context: 'week',
    },
  }
);

interface ShiftBlockProps extends VariantProps<typeof blockVariants> {
  item: Shift | Leave;
  onClick: () => void;
}


function isLeave(item: Shift | Leave): item is Leave {
  return 'type' in item;
}

export function ShiftBlock({ item, onClick, interactive, context }: ShiftBlockProps) {
  if (isLeave(item)) {
    const employee = getEmployeeById(item.employeeId);
    if (!employee) return null;

    const backgroundColor = item.color || '#f97316'; // default to orange if no color

    return (
      <div
        onClick={onClick}
        className={cn(blockVariants({ type: 'leave', interactive, context }))}
        style={{ backgroundColor: backgroundColor, color: 'white' }}
      >
        <p className="font-bold text-xs truncate">{item.type}</p>
        {!item.isAllDay && <p className="text-xs truncate">{item.startTime} - {item.endTime}</p>}
      </div>
    );
  }

  const shift = item;

  if (!shift.label) return null;

  if (shift.isDayOff || shift.isHolidayOff) {
    return (
       <div
        onClick={onClick}
        className={cn(blockVariants({ type: 'dayOff', interactive, context }))}
      >
        <p className="font-bold text-xs truncate whitespace-pre-wrap">{shift.label}</p>
         {context === 'week' && <p className="text-xs truncate whitespace-pre-wrap">All day</p>}
      </div>
    )
  }

  const employee = shift.employeeId ? getEmployeeById(shift.employeeId) : null;
  
  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'p' : 'a';
    hour = hour % 12 || 12; // convert to 12-hour format
    
    if (context === 'month') {
        if (m === '00') return `${hour}${suffix}`;
        return `${hour}:${m}${suffix}`;
    }

    return `${hour}:${m}${suffix}`;
  };

  const backgroundColor = shift.color || 'hsl(var(--primary))';
  const textColor = shift.color === '#ffffff' ? 'black' : 'white';
  const isDraft = shift.status === 'draft';

  return (
    <div
      onClick={onClick}
      className={cn(blockVariants({ type: 'shift', interactive, context }))}
      style={{ backgroundColor: backgroundColor, color: textColor, borderColor: backgroundColor === '#ffffff' ? 'hsl(var(--border))' : 'transparent' }}
    >
      {isDraft && (
        <div className="absolute inset-0 w-full h-full bg-striped-semitransparent z-10"></div>
      )}
      <div className="relative z-20">
        <p className="font-semibold text-xs truncate whitespace-pre-wrap">
          {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
        </p>
         {context === 'week' && <p className="text-xs truncate whitespace-pre-wrap">
          {shift.label}
        </p>}
      </div>
    </div>
  );
}
