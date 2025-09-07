
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

export default function ChatView() {
  return (
    <div className="grid grid-cols-[250px_1fr] h-[calc(100vh-12rem)] gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
            {/* This would be populated dynamically */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-2 rounded-md bg-accent">
                    <Avatar>
                        <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                        <AvatarFallback>AV</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">Anthony Villaceran</p>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50">
                    <Avatar>
                        <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                        <AvatarFallback>RL</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">Rodrigo Leynes</p>
                        <p className="text-xs text-muted-foreground">Offline</p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
       <Card className="flex flex-col">
        <CardHeader>
            <CardTitle>Anthony Villaceran</CardTitle>
            <CardDescription>Senior MAMS Support Engineer</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
            {/* Example Messages */}
            <div className="flex items-end gap-3">
                <Avatar className="h-8 w-8">
                     <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                     <AvatarFallback>AV</AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted max-w-xs">
                    <p>Hey, did you see the memo about the new server deployment?</p>
                    <p className="text-xs text-muted-foreground text-right mt-1">10:00 AM</p>
                </div>
            </div>
             <div className="flex items-end gap-3 justify-end">
                <div className="p-3 rounded-lg bg-primary text-primary-foreground max-w-xs">
                    <p>Yes, I did. I'm preparing the documentation for it now. Should be ready by EOD.</p>
                     <p className="text-xs text-primary-foreground/80 text-right mt-1">10:01 AM</p>
                </div>
                 <Avatar className="h-8 w-8">
                     <AvatarImage src="" />
                     <AvatarFallback>ME</AvatarFallback>
                </Avatar>
            </div>
        </CardContent>
        <CardContent className="border-t pt-4">
            <div className="flex items-center gap-2">
                <Input placeholder="Type your message..." />
                <Button>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
