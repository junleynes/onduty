
'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getBackgroundColor, getFullName } from '@/lib/utils';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Locate, RefreshCcw } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

type OrgChartViewProps = {
  employees: Employee[];
  currentUser: Employee | null;
};

type TreeNode = Employee & {
  children: TreeNode[];
};

const EmployeeNode = ({ node, isCurrentUser }: { node: TreeNode, isCurrentUser: boolean }) => {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="flex flex-col items-center text-center relative" id={`node-${node.id}`}>
      <Card className={`min-w-28 text-center shadow-md hover:shadow-lg transition-shadow z-10 bg-card ${isCurrentUser ? 'border-2 border-primary ring-2 ring-primary/50' : ''}`}>
        <CardContent className="p-2 flex flex-col items-center">
          <Avatar className="w-10 h-10 mb-1 border-2 border-primary">
            <AvatarImage src={node.avatar} data-ai-hint="profile avatar" />
            <AvatarFallback style={{ backgroundColor: getBackgroundColor(getFullName(node)) }} className="text-base">
              {getInitials(getFullName(node))}
            </AvatarFallback>
          </Avatar>
          <p className="font-bold text-sm">{getFullName(node)}</p>
          <p className="text-muted-foreground text-xs">{node.position}</p>
        </CardContent>
      </Card>
      {hasChildren && (
        <>
          {/* Vertical line from parent */}
          <div className="w-px h-4 bg-border" />
          <div className="flex justify-center gap-2 pt-4 relative">
            {/* Horizontal line connecting children - rendered before children to be in background */}
            {node.children.length > 1 && (
                 <div className="absolute top-4 h-px bg-border left-10 right-10" />
            )}
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                 {/* Vertical line to child */}
                 <div className="absolute -top-4 w-px h-4 bg-border" />
                <EmployeeNode node={child} isCurrentUser={isCurrentUser && child.id === child.id} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export default function OrgChartView({ employees, currentUser }: OrgChartViewProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.2));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };
  
  const handleFocusMe = () => {
      if (!currentUser || !containerRef.current) return;
      const userNode = document.getElementById(`node-${currentUser.id}`);
      if (userNode) {
          const container = containerRef.current;
          const containerRect = container.getBoundingClientRect();
          const nodeRect = userNode.getBoundingClientRect();
          
          setScale(1); // Reset zoom
          
          // Center the user node
          const newX = (containerRect.width / 2) - (nodeRect.left - containerRect.left) - (nodeRect.width / 2);
          const newY = (containerRect.height / 2) - (nodeRect.top - containerRect.top) - (nodeRect.height / 2);
          
          setPan({ x: newX, y: newY });
      }
  };


  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const onMouseUp = () => setIsDragging(false);
  const onMouseLeave = () => setIsDragging(false);

  const treesByGroup = useMemo(() => {
    const groupedEmployees: Record<string, Employee[]> = {};
    employees.forEach(emp => {
      if (emp.role !== 'admin') {
        const group = emp.group || 'Unassigned';
        if (!groupedEmployees[group]) {
          groupedEmployees[group] = [];
        }
        groupedEmployees[group].push(emp);
      }
    });

    return Object.entries(groupedEmployees).map(([groupName, groupMembers]) => {
      const map = new Map<string, TreeNode>();
      groupMembers.forEach(emp => map.set(emp.id, { ...emp, children: [] }));

      const roots: TreeNode[] = [];
      map.forEach(node => {
        // Simplified hierarchy: managers are roots, members are their children.
        if (node.role === 'manager') {
            roots.push(node);
        }
      });
      
      const managers = roots;
      const members = groupMembers.filter(e => e.role === 'member');
      const assignedMembers = new Set<string>();

      members.forEach(member => {
         const manager = managers.find(m => m.id !== member.id);
         if (manager) {
             manager.children.push(map.get(member.id)!);
             assignedMembers.add(member.id);
         }
      });
      
      // If there are no managers, all members are roots
      if (roots.length === 0) {
        roots.push(...members.map(m => map.get(m.id)!));
      }

      return { groupName, tree: roots };
    });

  }, [employees]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Organizational Chart</CardTitle>
                <CardDescription>Visual representation of the team structure by group.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomIn}><ZoomIn /></Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut}><ZoomOut /></Button>
                <Button variant="outline" size="icon" onClick={handleReset}><RefreshCcw /></Button>
                <Button variant="outline" size="icon" onClick={handleFocusMe}><Locate /></Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <div 
          ref={containerRef}
          className="w-full h-full overflow-hidden cursor-grab"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <div 
            className="w-full h-full transition-transform duration-100 ease-linear"
            style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center center'
            }}
          >
             <div className="flex flex-col items-center gap-10 p-8">
                {treesByGroup.map(({ groupName, tree }) => (
                    <div key={groupName} className="w-full">
                        <h2 className="text-xl font-bold text-center mb-4 border-b pb-2">{groupName}</h2>
                        {tree.length > 0 ? (
                             <div className="flex justify-center gap-10 items-start">
                                {tree.map(rootNode => (
                                    <EmployeeNode key={rootNode.id} node={rootNode} isCurrentUser={currentUser?.id === rootNode.id} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">No managers assigned to this group.</p>
                        )}
                    </div>
                ))}
                {treesByGroup.length === 0 && (
                    <p className="text-center text-muted-foreground">No groups or members found to build the chart.</p>
                )}
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
