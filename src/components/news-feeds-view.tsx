
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import { ThumbsUp, MessageSquare } from 'lucide-react';

const newsItems = [
    {
        id: 1,
        author: 'Management',
        avatar: 'https://i.pravatar.cc/150?u=management',
        time: '2 hours ago',
        content: "We're excited to announce our annual company picnic will be held next month! Mark your calendars for a day of fun, food, and team-building activities. More details to follow soon.",
        image: 'https://picsum.photos/800/400?random=1',
        likes: 42,
        comments: 8,
    },
    {
        id: 2,
        author: 'HR Department',
        avatar: 'https://i.pravatar.cc/150?u=hr',
        time: '1 day ago',
        content: 'Reminder: Open enrollment for health benefits ends this Friday. Please make sure to submit your selections through the employee portal. Contact HR for any questions.',
        image: null,
        likes: 15,
        comments: 2,
    },
     {
        id: 3,
        author: 'IT Department',
        avatar: 'https://i.pravatar.cc/150?u=it',
        time: '3 days ago',
        content: 'There will be a scheduled system maintenance this Saturday from 2:00 AM to 4:00 AM. Access to internal systems may be intermittent during this period. We apologize for any inconvenience.',
        image: 'https://picsum.photos/800/400?random=2',
        likes: 9,
        comments: 0,
    }
]

export default function NewsFeedsView() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>News & Announcements</CardTitle>
            <CardDescription>Stay up-to-date with the latest company news and announcements.</CardDescription>
        </CardHeader>
      </Card>
      {newsItems.map(item => (
        <Card key={item.id}>
            <CardHeader className="flex flex-row items-center gap-4">
                <Image src={item.avatar} alt={item.author} width={40} height={40} className="rounded-full" data-ai-hint="profile avatar" />
                <div>
                    <p className="font-semibold">{item.author}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-4">{item.content}</p>
                {item.image && (
                     <div className="aspect-video relative rounded-lg overflow-hidden">
                        <Image src={item.image} alt="News item image" fill className="object-cover" data-ai-hint="news announcement" />
                     </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{item.likes} Likes</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{item.comments} Comments</span>
                    </Button>
                </div>
                 <Button variant="outline" size="sm">Read More</Button>
            </CardFooter>
        </Card>
      ))}
    </div>
  );
}
