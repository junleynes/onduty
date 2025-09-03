

'use client';

import React, { useState, useMemo } from 'react';
import type { Leave, Employee, LeaveRequestStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getFullName } from '@/lib/utils';
import { PlusCircle, Check, X } from 'lucide-react';
import { LeaveRequestDialog } from './leave-request-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from 'uuid';
import type { LeaveTypeOption } from './leave-type-editor';

type TimeOffViewProps = {
  leaveRequests: Leave[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<Leave[]>>;
  currentUser: Employee;
  employees: Employee[];
  leaveTypes: LeaveTypeOption[];
};

export default function TimeOffView({ leaveRequests, setLeaveRequests, currentUser, employees, leaveTypes }: TimeOffViewProps) {
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Partial<Leave> | null>(null);

  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  const myRequests = useMemo(() => 
    leaveRequests.filter(req => req.employeeId === currentUser.id),
  [leaveRequests, currentUser.id]);

  const teamRequests = useMemo(() => 
    isManager 
      ? leaveRequests.filter(req => {
          const employee = employees.find(e => e.id === req.employeeId);
          return employee?.group === currentUser.group;
        })
      : [],
  [leaveRequests, employees, currentUser.group, isManager]);
  
  const handleNewRequest = () => {
    setEditingRequest(null);
    setIsRequestDialogOpen(true);
  };
  
  const handleEditRequest = (request: Leave) => {
    if (request.status !== 'pending') {
        toast({ variant: 'destructive', title: 'Cannot Edit', description: 'Only pending requests can be edited.' });
        return;
    }
    setEditingRequest(request);
    setIsRequestDialogOpen(true);
  }

  const handleSaveRequest = (requestData: Partial<Leave>) => {
    if (editingRequest?.id) { // Editing
      setLeaveRequests(prev => prev.map(r => r.id === editingRequest.id ? { ...r, ...requestData } as Leave : r));
      toast({ title: 'Request Updated' });
    } else { // Creating
      const leaveTypeDetails = leaveTypes.find(lt => lt.type === requestData.type);
      const newRequest: Leave = {
        id: uuidv4(),
        employeeId: currentUser.id,
        status: 'pending',
        requestedAt: new Date(),
        ...requestData,
        color: leaveTypeDetails?.color || '#6b7280',
      } as Leave;
      setLeaveRequests(prev => [newRequest, ...prev]);
      toast({ title: 'Request Submitted' });
    }
    setIsRequestDialogOpen(false);
  };
  
  const handleManageRequest = (requestId: string, newStatus: 'approved' | 'rejected') => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const leaveTypeDetails = leaveTypes.find(lt => lt.type === req.type);
        return { 
          ...req, 
          status: newStatus, 
          managedBy: currentUser.id, 
          managedAt: new Date(),
          color: leaveTypeDetails?.color || req.color
        };
      }
      return req;
    }));
    toast({ title: `Request ${newStatus}` });
  };
  
  const RequestTable = ({ requests, forManagerView = false }: { requests: Leave[], forManagerView?: boolean }) => (
     <Table>
        <TableHeader>
            <TableRow>
            {forManagerView && <TableHead>Employee</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {requests.map(req => {
              const employee = employees.find(e => e.id === req.employeeId);
              return (
                <TableRow key={req.id}>
                    {forManagerView && <TableCell>{employee ? getFullName(employee) : 'Unknown'}</TableCell>}
                    <TableCell className="font-medium">{req.type}</TableCell>
                    <TableCell>{format(new Date(req.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                    <TableCell><Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right">
                        {forManagerView && req.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleManageRequest(req.id, 'approved')}><Check className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleManageRequest(req.id, 'rejected')}><X className="h-4 w-4" /></Button>
                            </div>
                        )}
                        {!forManagerView && req.status === 'pending' && (
                             <Button size="sm" variant="outline" onClick={() => handleEditRequest(req)}>Edit</Button>
                        )}
                    </TableCell>
                </TableRow>
              )
            })}
        </TableBody>
    </Table>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Time Off Requests</CardTitle>
            <CardDescription>Manage your leave requests and work extensions.</CardDescription>
          </div>
           <Button onClick={handleNewRequest}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Request
            </Button>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue={isManager ? "team-requests" : "my-requests"} className="w-full">
                <TabsList>
                    <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                    {isManager && <TabsTrigger value="team-requests">Team Requests</TabsTrigger>}
                </TabsList>
                <TabsContent value="my-requests">
                    {myRequests.length > 0 ? <RequestTable requests={myRequests} /> : <p className="text-center text-muted-foreground p-8">You haven't made any requests yet.</p>}
                </TabsContent>
                {isManager && (
                    <TabsContent value="team-requests">
                        {teamRequests.length > 0 ? <RequestTable requests={teamRequests} forManagerView /> : <p className="text-center text-muted-foreground p-8">Your team members haven't made any requests yet.</p>}
                    </TabsContent>
                )}
            </Tabs>
        </CardContent>
      </Card>
      
      <LeaveRequestDialog 
        isOpen={isRequestDialogOpen}
        setIsOpen={setIsRequestDialogOpen}
        onSave={handleSaveRequest}
        request={editingRequest}
        leaveTypes={leaveTypes}
      />
    </>
  );
}

    