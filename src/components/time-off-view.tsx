

'use client';

import React, { useState, useMemo, useTransition } from 'react';
import type { Leave, Employee, LeaveRequestStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { getFullName } from '@/lib/utils';
import { PlusCircle, Check, X, FileDown, Mail, Eye, Upload, Loader2 } from 'lucide-react';
import { LeaveRequestDialog } from './leave-request-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from 'uuid';
import type { LeaveTypeOption } from './leave-type-editor';
import { generateLeavePdf, sendEmail } from '@/app/actions';
import type { SmtpSettings } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

type TimeOffViewProps = {
  leaveRequests: Leave[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<Leave[]>>;
  currentUser: Employee;
  employees: Employee[];
  leaveTypes: LeaveTypeOption[];
  smtpSettings: SmtpSettings;
  onUploadAlaf: () => void;
};

export default function TimeOffView({ leaveRequests, setLeaveRequests, currentUser, employees, leaveTypes, smtpSettings, onUploadAlaf }: TimeOffViewProps) {
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Partial<Leave> | null>(null);
  const [emailingRequest, setEmailingRequest] = useState<Leave | null>(null);

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
        endDate: requestData.endDate || requestData.startDate, // Ensure endDate is set
        dateFiled: new Date(),
        department: currentUser.group || '',
        idNumber: currentUser.employeeNumber || '',
        contactInfo: currentUser.phone || '',
        employeeSignature: currentUser.signature,
        color: leaveTypeDetails?.color || '#6b7280',
      } as Leave;
      setLeaveRequests(prev => [newRequest, ...prev]);
      toast({ title: 'Request Submitted' });
    }
    setIsRequestDialogOpen(false);
  };
  
  const handleManageRequest = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    let updatedRequest: Leave | undefined;
    
    setLeaveRequests(prev => {
        const newLeaveRequests = prev.map(req => {
            if (req.id === requestId) {
                const leaveTypeDetails = leaveTypes.find(lt => lt.type === req.type);
                updatedRequest = { 
                    ...req, 
                    status: newStatus, 
                    managedBy: currentUser.id, 
                    managedAt: new Date(),
                    managerSignature: currentUser.signature,
                    color: leaveTypeDetails?.color || req.color
                };
                return updatedRequest;
            }
            return req;
        });
        return newLeaveRequests;
    });

    if (newStatus === 'approved' && updatedRequest) {
        toast({ title: "Generating PDF...", description: "Please wait a moment." });
        const result = await generateLeavePdf(updatedRequest);
        if (result.success && result.pdfDataUri) {
            setLeaveRequests(prev => prev.map(req => req.id === requestId ? { ...req, pdfDataUri: result.pdfDataUri } : req));
            toast({ title: "Request Approved & PDF Generated", description: "The leave form has been created." });
        } else {
            toast({ variant: 'destructive', title: 'PDF Generation Failed', description: result.error });
        }
    } else {
        toast({ title: `Request ${newStatus}` });
    }
  };

  const handleDownloadPdf = (pdfDataUri: string, employeeName: string) => {
    const link = document.createElement('a');
    link.href = pdfDataUri;
    link.download = `Leave Application - ${employeeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEmailDialog = (leaveRequest: Leave) => {
    setEmailingRequest(leaveRequest);
    setIsEmailDialogOpen(true);
  };
  
  const RequestTable = ({ requests, forManagerView = false }: { requests: Leave[], forManagerView?: boolean }) => (
     <Table>
        <TableHeader>
            <TableRow>
            {forManagerView && <TableHead>Employee</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {requests.map(req => {
              const employee = employees.find(e => e.id === req.employeeId);
              const startDate = new Date(req.startDate);
              const endDate = new Date(req.endDate);
              const dateDisplay = isSameDay(startDate, endDate)
                ? format(startDate, 'MMM d, yyyy')
                : `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;

              return (
                <TableRow key={req.id}>
                    {forManagerView && <TableCell>{employee ? getFullName(employee) : 'Unknown'}</TableCell>}
                    <TableCell className="font-medium">{req.type}</TableCell>
                    <TableCell>{dateDisplay}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                    <TableCell><Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right">
                        {forManagerView ? (
                          req.status === 'pending' ? (
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleManageRequest(req.id, 'approved')}><Check className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleManageRequest(req.id, 'rejected')}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : req.pdfDataUri && (
                            <div className="flex gap-2 justify-end">
                              <a href={req.pdfDataUri} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button></a>
                              <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(req.pdfDataUri!, getFullName(employee!))}><FileDown className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handleOpenEmailDialog(req)}><Mail className="h-4 w-4" /></Button>
                            </div>
                          )
                        ) : (
                           req.status === 'pending' ? (
                             <Button size="sm" variant="outline" onClick={() => handleEditRequest(req)}>Edit</Button>
                           ) : req.pdfDataUri && (
                            <div className="flex gap-2 justify-end">
                               <a href={req.pdfDataUri} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button></a>
                               <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(req.pdfDataUri!, getFullName(employee!))}><FileDown className="h-4 w-4" /></Button>
                            </div>
                           )
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
           <div className="flex gap-2">
                {isManager && (
                    <Button variant="outline" onClick={onUploadAlaf}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload ALAF Template
                    </Button>
                )}
               <Button onClick={handleNewRequest}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Request
                </Button>
           </div>
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
        currentUser={currentUser}
      />

      {emailingRequest && (
        <EmailDialog
            isOpen={isEmailDialogOpen}
            setIsOpen={setIsEmailDialogOpen}
            leaveRequest={emailingRequest}
            smtpSettings={smtpSettings}
            employees={employees}
        />
      )}
    </>
  );
}


type EmailDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    leaveRequest: Leave;
    smtpSettings: SmtpSettings;
    employees: Employee[];
};

function EmailDialog({ isOpen, setIsOpen, leaveRequest, smtpSettings, employees }: EmailDialogProps) {
    const employee = employees.find(e => e.id === leaveRequest.employeeId);
    
    const defaultSubject = `Leave Request - ${employee ? getFullName(employee) : 'N/A'}`;
    const defaultBody = `
        <p>Dear ${employee?.firstName},</p>
        <p>Please find attached your leave application form for your request from ${format(new Date(leaveRequest.startDate), 'MMM d, yyyy')} to ${format(new Date(leaveRequest.endDate), 'MMM d, yyyy')}.</p>
        <p>Details:</p>
        <ul>
            <li><strong>Type:</strong> ${leaveRequest.type}</li>
            <li><strong>Reason:</strong> ${leaveRequest.reason}</li>
            <li><strong>Status:</strong> ${leaveRequest.status}</li>
        </ul>
        <p>Thank you,</p>
        <p>OnDuty System</p>
    `;

    const [to, setTo] = useState(employee?.email || '');
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState(defaultBody.replace(/<p>|<\/p>|<ul>|<\/ul>|<li>|<\/li>|<strong>|<\/strong>/g, ''));
    const [isSending, startTransition] = useTransition();
    const { toast } = useToast();

    React.useEffect(() => {
        if (isOpen && employee) {
            setTo(employee.email);
            setSubject(`Leave Request - ${getFullName(employee)}`);
            setBody(`Dear ${employee.firstName},\n\nPlease find attached your leave application form for your request from ${format(new Date(leaveRequest.startDate), 'MMM d, yyyy')} to ${format(new Date(leaveRequest.endDate), 'MMM d, yyyy')}.\n\nDetails:\n- Type: ${leaveRequest.type}\n- Reason: ${leaveRequest.reason}\n- Status: ${leaveRequest.status}\n\nThank you,\nOnDuty System`);
        }
    }, [isOpen, leaveRequest, employee]);
    
    const handleSend = async () => {
        if (!to) {
            toast({ variant: 'destructive', title: 'Recipient required', description: 'Please enter an email address.' });
            return;
        }
        if (!leaveRequest.pdfDataUri) {
            toast({ variant: 'destructive', title: 'PDF not found', description: 'The leave form PDF is not available to attach.' });
            return;
        }

        startTransition(async () => {
            const attachment = {
                filename: `Leave Application - ${employee ? getFullName(employee) : 'Unknown'}.pdf`,
                content: leaveRequest.pdfDataUri!.split('base64,')[1],
                contentType: 'application/pdf',
            };

            toast({ title: 'Sending email...', description: `Sending leave form to ${to}` });
            const result = await sendEmail({ to, subject, htmlBody: body.replace(/\n/g, '<br>'), attachments: [attachment] }, smtpSettings);

            if (result.success) {
                toast({ title: 'Email Sent!', description: 'The leave form has been sent successfully.' });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Email Failed', description: result.error });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Leave Form</DialogTitle>
                    <DialogDescription>The approved ALAF will be sent as a PDF attachment.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipientEmail">Recipient Email</Label>
                        <Input id="recipientEmail" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
                    </div>
                     <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isSending}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
