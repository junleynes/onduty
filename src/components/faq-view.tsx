
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  {
    question: 'How do I request time off?',
    answer: 'Navigate to the "Time Off" section from the sidebar. Click the "New Request" button, fill in the required details such as leave type and dates, and submit your request. Your manager will be notified to review it.'
  },
  {
    question: 'Where can I see my schedule for the upcoming week?',
    answer: 'You can view your personal schedule by clicking on "My Schedule" in the sidebar. This will show you all your assigned shifts for the selected period.'
  },
  {
    question: 'How are shift tasks assigned?',
    answer: 'Shift-specific tasks are assigned by your manager or administrator when they create or edit a shift. You can view tasks assigned to your shifts in the "My Shift Tasks" section.'
  },
  {
    question: 'What does "Publish" on the schedule page do?',
    answer: 'When a manager clicks "Publish," all shifts in the current view are marked as final and become visible to all team members. Notifications are also sent out to inform the team that the schedule is ready.'
  },
  {
    question: 'How do I update my mobile load balance?',
    answer: 'Go to the "Mobile Load" section. You will see a list of team members. Click the pencil icon next to your name to open the editor, where you can input your current balance and upload a screenshot as proof.'
  },
  {
    question: 'Can I import a schedule from a CSV file?',
    answer: 'Yes, managers and admins can import schedules. Go to the main "Schedule" view, click the "Actions" button, and select "Import Schedule." You will be prompted to upload a CSV file with the required format.'
  },
  {
    question: 'How do I use Shift Templates?',
    answer: 'In the Schedule view, open the Shift Editor for any shift. In the "Templates" tab, you can apply an existing template to the current shift, or save the current shift\'s details as a new template for future use. You can also import templates from a CSV file via the "Actions" menu.',
  },
  {
    question: 'How do I manage Leave Types?',
    answer: 'In the Schedule view, click the "Actions" button and select "Manage Leave Types". A dialog will appear where you can add, edit, or remove different types of leave (e.g., Vacation, Sick Leave) and set their corresponding colors for the schedule.',
  },
  {
    question: 'How do I upload a template for Reports?',
    answer: 'Navigate to the "Reports" page. For reports that support templates (like Work Schedule or Attendance Sheet), there will be an "Upload Template" button. Clicking this will open a dialog where you can upload a formatted .xlsx file. The dialog will provide instructions on the required placeholders.',
  },
];

export default function FaqView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription>Find answers to common questions about using the OnDuty application.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent className="text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
