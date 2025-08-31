
'use client';

import React from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Download } from 'lucide-react';

type ReportData = {
    headers: string[];
    rows: (string | number)[][];
};

type ReportPreviewDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  data: ReportData | null;
  onDownload: (() => Promise<void>) | null;
};

export function ReportPreviewDialog({ isOpen, setIsOpen, title, data, onDownload }: ReportPreviewDialogProps) {
  
  const handleDownload = async () => {
      if (onDownload) {
          await onDownload();
      }
      setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This is a preview of the report data. Download the formatted Excel file below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] border rounded-md">
            <Table>
                <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                    {data?.headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                    ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{String(cell)}</TableCell>
                        ))}
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
             {(!data || data.rows.length === 0) && (
                <div className="text-center p-8 text-muted-foreground">
                    <p>No data available for this report.</p>
                </div>
             )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={!onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download as Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
