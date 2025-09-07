
'use client';

import React, { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { resetToFactorySettings, purgeData } from '@/app/actions';
import { Loader2, History, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';

type PurgeableData = 'users' | 'shiftTemplates' | 'holidays' | 'reportTemplates' | 'tasks' | 'mobileLoad';

type DangerZoneViewProps = {
    onPurgeData: (dataType: PurgeableData) => void;
};

export default function DangerZoneView({ onPurgeData }: DangerZoneViewProps) {
    const { toast } = useToast();
    const [isResetting, startResetTransition] = useTransition();
    const [isPurging, startPurgeTransition] = useTransition();

    const handleFactoryReset = () => {
        startResetTransition(async () => {
          const result = await resetToFactorySettings();
          if (result.success) {
            toast({ title: "System Reset Successful", description: "The application has been restored to factory settings. Please log in again." });
            setTimeout(() => window.location.reload(), 1500);
          } else {
            toast({ variant: 'destructive', title: 'Reset Failed', description: result.error || "An unknown error occurred." });
          }
        });
      };

    const handlePurge = (dataType: PurgeableData, friendlyName: string) => {
        startPurgeTransition(async () => {
            const result = await purgeData(dataType);
            if (result.success) {
                onPurgeData(dataType);
                toast({ title: 'Data Purged', description: `All ${friendlyName} have been deleted.` });
            } else {
                toast({ variant: 'destructive', title: 'Purge Failed', description: result.error || `Could not delete ${friendlyName}.` });
            }
        });
    };

    const purgeItems: { type: PurgeableData; title: string; description: string, buttonText: string, friendlyName: string }[] = [
        { type: 'users', title: 'Delete All Users', description: 'This will permanently delete all users except for the Super Admin, along with their associated shifts, leave, and tasks.', buttonText: 'Delete Users', friendlyName: 'users' },
        { type: 'shiftTemplates', title: 'Delete All Shift Templates', description: 'This will permanently delete all saved shift templates.', buttonText: 'Delete Shift Templates', friendlyName: 'shift templates' },
        { type: 'holidays', title: 'Delete All Holidays', description: 'This will permanently delete all holidays from the schedule.', buttonText: 'Delete Holidays', friendlyName: 'holidays' },
        { type: 'reportTemplates', title: 'Delete All Report Templates', description: 'This will permanently delete all uploaded Excel templates for reports.', buttonText: 'Delete Report Templates', friendlyName: 'report templates' },
        { type: 'tasks', title: 'Delete All Tasks', description: 'This will permanently delete all personal, global, and shift-specific tasks.', buttonText: 'Delete Tasks', friendlyName: 'tasks' },
        { type: 'mobileLoad', title: 'Reset All Mobile Load Data', description: 'This will delete all historical mobile load balance records and reset every user\'s Load Allocation to zero.', buttonText: 'Reset Mobile Load', friendlyName: 'mobile load data' },
    ];

    return (
        <Card className="max-w-2xl mx-auto border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>These actions are irreversible and will affect the entire application. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {purgeItems.map((item, index) => (
                    <React.Fragment key={item.type}>
                        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                            <div>
                                <h4 className="font-semibold">{item.title}</h4>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isPurging} className="w-48">
                                        {isPurging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                        {item.buttonText}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>{item.description} This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePurge(item.type, item.friendlyName)}>Yes, delete them</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </React.Fragment>
                ))}

                <Separator />

                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                    <div>
                        <h4 className="font-semibold">Restore Factory Settings</h4>
                        <p className="text-sm text-muted-foreground">This will delete all application data and restore it to its initial state.</p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isResetting} className="w-48">
                                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                                Factory Reset
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action is permanent and cannot be undone. All application data will be deleted, and you will be logged out.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleFactoryReset}>Yes, restore factory settings</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
