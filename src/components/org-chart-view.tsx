
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
  return (
    <div className="flex flex-col items-center">
      <Card className="min-w-64 text-center shadow-md hover:shadow-lg transition-shadow">
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
            {node.role}
          </Badge>
        </CardContent>
      </Card>
      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-8 bg-border" />
          <div className="flex justify-center gap-8 relative">
            <div className="absolute top-0 left-1/2 -right-1/2 h-px bg-border -translate-x-1/2" style={{ left: 'calc(50% - (50% / var(--child-count)))', right: 'calc(50% - (50% / var(--child-count)))' }}></div>
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative" style={{ '--child-count': node.children.length } as React.CSSProperties}>
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
    const tree: TreeNode[] = [];
    const map = new Map<string, TreeNode>();

    employees.forEach(emp => {
      map.set(emp.id, { ...emp, children: [] });
    });

    const admins: TreeNode[] = [];
    const managers: TreeNode[] = [];
    const members: TreeNode[] = [];

    map.forEach(node => {
        if (node.role === 'admin') admins.push(node);
        else if (node.role === 'manager') managers.push(node);
        else members.push(node);
    });

    members.forEach(member => {
        // Find a manager in the same group
        const manager = managers.find(m => m.group === member.group);
        if (manager) {
            manager.children.push(member);
        } else {
            // If no manager in group, attach to any admin (fallback)
             const admin = admins[0];
             if(admin) admin.children.push(member);
        }
    });
    
    managers.forEach(manager => {
        // Attach all managers to all admins
        admins.forEach(admin => admin.children.push(manager));
    });

    return admins;
  }, [employees]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizational Chart</CardTitle>
        <CardDescription>Visual representation of the team structure.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full h-[70vh] p-4">
             <div className="flex justify-center">
                {tree.map(rootNode => (
                    <EmployeeNode key={rootNode.id} node={rootNode} />
                ))}
             </div>
             {tree.length === 0 && (
                <p className="text-center text-muted-foreground">No employees found to build the chart.</p>
             )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
