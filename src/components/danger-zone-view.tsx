
'use client';

import React, { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { resetToFactorySettings } from '@/app/actions';
import { Loader2, History } from 'lucide-react';

export default function DangerZoneView() {
    const { toast } = useToast();
    const [isResetting, startResetTransition] = useTransition();

    const handleFactoryReset = () => {
        startResetTransition(async () => {
          const result = await resetToFactorySettings();
          if (result.success) {
            toast({ title: "System Reset Successful", description: "The application has been restored to factory settings. Please log in again." });
            // Force a reload to clear all state and re-initialize the app
            setTimeout(() => window.location.reload(), 1500);
          } else {
            toast({ variant: 'destructive', title: 'Reset Failed', description: result.error || "An unknown error occurred." });
          }
        });
      };

    return (
        <Card className="max-w-2xl mx-auto border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>These actions are irreversible and will affect the entire application. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                    <div>
                        <h4 className="font-semibold">Restore Factory Settings</h4>
                        <p className="text-sm text-muted-foreground">This will delete all data, including users, shifts, and settings, and restore the application to its initial state.</p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isResetting}>
                                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                                Restore
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
