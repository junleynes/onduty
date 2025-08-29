
'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import type { Employee, UserRole } from '@/types';

type MemberImporterProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (newMembers: Partial<Employee>[]) => void;
};

export function MemberImporter({ isOpen, setIsOpen, onImport }: MemberImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a CSV file to import.', variant: 'destructive' });
      return;
    }
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length) {
            console.error("CSV parsing errors:", results.errors);
            throw new Error(`Error parsing CSV on row ${results.errors[0].row}: ${results.errors[0].message}`);
          }
          
          const requiredHeaders = ['First Name', 'Last Name', 'Email'];
          const headers = results.meta.fields || [];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns in CSV: ${missingHeaders.join(', ')}`);
          }

          const newMembers: Partial<Employee>[] = results.data.map((row: any) => {
            const parseDate = (dateStr: string) => {
                if (!dateStr) return undefined;
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? undefined : date;
            }
            
            const role = (row['Role']?.toLowerCase() || 'member') as UserRole;
            if (!['admin', 'manager', 'member'].includes(role)) {
                console.warn(`Invalid role "${row['Role']}" for user ${row['First Name']}. Defaulting to 'member'.`);
            }

            return {
              firstName: row['First Name'] || '',
              lastName: row['Last Name'] || '',
              middleInitial: row['M.I.'] || '',
              position: row['Position'] || '',
              birthDate: parseDate(row['Birth Date']),
              startDate: parseDate(row['Start Date']),
              group: row['Group'] || row['Department'] || '',
              email: row['Email'] || '',
              phone: row['Phone'] || '',
              employeeNumber: row['Employee Number'] || '',
              password: row['Password'] || 'password', // Default password if not provided
              role: ['admin', 'manager', 'member'].includes(role) ? role : 'member',
            };
          });

          onImport(newMembers);
          setIsOpen(false);

        } catch (error) {
          console.error("Import failed:", error);
          toast({ title: 'Import Failed', description: (error as Error).message, variant: 'destructive' });
        } finally {
          setIsImporting(false);
          setFile(null);
        }
      },
      error: (error) => {
        toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
        setIsImporting(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Members from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with member data. Required headers are: First Name, Last Name, Email. Other supported headers are M.I., Position, Birth Date, Start Date, Group, Phone, Employee Number, Password, Role.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Label htmlFor="member-file">CSV File</Label>
            <Input id="member-file" type="file" onChange={handleFileChange} accept=".csv" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
