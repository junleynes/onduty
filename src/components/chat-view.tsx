
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
        <CardDescription>This is a placeholder for the Chat feature. Functionality to be added.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          <p>Chat functionality is coming soon!</p>
        </div>
      </CardContent>
    </Card>
  );
}
