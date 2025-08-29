
'use client';

import React, { useMemo } from 'react';
import type { Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

type OrgChartViewProps = {
  employees: Employee[];
};

type TreeNode = Employee & {
  children: TreeNode[];
};

const EmployeeNode = ({ node }: { node: TreeNode }) => {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="flex flex-col items-center text-center relative">
      <Card className="min-w-56 text-center shadow-md hover:shadow-lg transition-shadow z-10 bg-card">
        <CardContent className="p-4 flex flex-col items-center">
          <Avatar className="w-16 h-16 mb-2 border-2 border-primary">
            <AvatarImage src={node.avatar} data-ai-hint="profile avatar" />
            <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(node)) }} className="text-xl">
              {getInitials(getFullName(node))}
            </AvatarFallback>
          </Avatar>
          <p className="font-bold text-lg">{getFullName(node)}</p>
          <p className="text-muted-foreground">{node.position}</p>
          <Badge variant={node.role === 'admin' ? 'destructive' : node.role === 'manager' ? 'default' : 'secondary'} className="mt-2 capitalize">
            {node.position === 'Senior Manager' ? 'Senior Manager' : node.role}
          </Badge>
        </CardContent>
      </Card>
      {hasChildren && (
        <>
          {/* Vertical line from parent */}
          <div className="w-px h-8 bg-border" />
          {/* Horizontal line connecting children */}
          <div
            className="absolute h-px bg-border"
            style={{
              top: `calc(100% + 1.5rem)`, // Position below parent card
              left: '50%',
              right: '50%',
              width: `calc(${node.children.length > 1 ? '100% - 14rem' : '0px'})`, // Full width minus one card width
              transform: `translateX(calc(-50% + ${node.children.length > 1 ? '7rem' : '0px'}))` // Adjust for card width
            }}
          />
          <div className="flex justify-center gap-8 pt-8 relative">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                 {/* Vertical line to child */}
                 <div className="absolute -top-8 w-px h-8 bg-border" />
                <EmployeeNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export default function OrgChartView({ employees }: OrgChartViewProps) {
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    employees.forEach(emp => {
      if (emp.role !== 'admin') { // Exclude admins
        map.set(emp.id, { ...emp, children: [] });
      }
    });

    const seniorManagers: TreeNode[] = [];
    const managers: TreeNode[] = [];
    const members: TreeNode[] = [];
    
    // Separate employees by role/position
    map.forEach(node => {
        if (node.position === 'Senior Manager') {
            seniorManagers.push(node);
        } else if (node.role === 'manager') {
            managers.push(node);
        } else {
            members.push(node);
        }
    });
    
    const roots: TreeNode[] = [];
    const assignedManagers = new Set<string>();

    // Assign members to managers
    members.forEach(member => {
        const manager = managers.find(m => m.group === member.group) || seniorManagers.find(sm => sm.group === member.group);
        if (manager) {
            manager.children.push(member);
        } else {
            // If no manager in group, attach to any senior manager as a fallback, or consider them root-level if none exist.
             const fallbackManager = seniorManagers[0];
             if(fallbackManager) fallbackManager.children.push(member);
        }
    });
    
    // Assign managers to senior managers
    managers.forEach(manager => {
        const seniorManager = seniorManagers.find(sm => sm.group === manager.group);
        if (seniorManager) {
            seniorManager.children.push(manager);
            assignedManagers.add(manager.id);
        }
    });
    
    // All senior managers are roots
    roots.push(...seniorManagers);

    // Any manager not assigned to a senior manager is also a root
    managers.forEach(manager => {
        if(!assignedManagers.has(manager.id)) {
            roots.push(manager);
        }
    });
    
    // If there are no managers at all, members might become roots (edge case)
    if (roots.length === 0 && members.length > 0 && map.size === members.length) {
       roots.push(...members);
    }

    return roots;

  }, [employees]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizational Chart</CardTitle>
        <CardDescription>Visual representation of the team structure.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full h-[70vh] p-4">
             <div className="flex justify-center gap-16 items-start">
                {tree.map(rootNode => (
                    <EmployeeNode key={rootNode.id} node={rootNode} />
                ))}
             </div>
             {tree.length === 0 && (
                <p className="text-center text-muted-foreground">No managers or members found to build the chart.</p>
             )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
