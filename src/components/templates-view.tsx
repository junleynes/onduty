'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const sampleTemplates = [
  { id: 'template-1', name: 'Standard Week', description: 'A typical week with full coverage.' },
  { id: 'template-2', name: 'Holiday Schedule', description: 'Reduced staff for holiday periods.' },
  { id: 'template-3', name: 'Summer Season', description: 'Increased staff for the busy summer season.' },
];

export default function TemplatesView() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Schedule Templates</CardTitle>
          <CardDescription>Manage your reusable schedule templates.</CardDescription>
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell className="text-muted-foreground">{template.description}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                   <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!sampleTemplates.length && (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <p>You haven't saved any templates yet.</p>
              <p className="text-sm mt-2">Create a schedule and save it as a template to get started.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
