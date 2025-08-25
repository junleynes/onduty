// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Smart Scheduling Tool for generating shift schedules.
 *
 * - generateSchedule - A function that generates a shift schedule based on employee availability, demand forecasts, and organizational rules.
 * - GenerateScheduleInput - The input type for the generateSchedule function.
 * - GenerateScheduleOutput - The return type for the generateSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScheduleInputSchema = z.object({
  employeeAvailability: z
    .string()
    .describe(
      'Employee availability data, including employee IDs and available hours for each day of the week.'
    ),
  demandForecasts: z
    .string()
    .describe(
      'Demand forecasts data, including expected workload or customer traffic for each hour of the day.'
    ),
  organizationalRules: z
    .string()
    .describe(
      'Predefined organizational rules, including minimum staffing levels, shift lengths, and employee roles.'
    ),
});
export type GenerateScheduleInput = z.infer<typeof GenerateScheduleInputSchema>;

const GenerateScheduleOutputSchema = z.object({
  shiftSchedule: z.string().describe('The generated shift schedule.'),
});
export type GenerateScheduleOutput = z.infer<typeof GenerateScheduleOutputSchema>;

export async function generateSchedule(input: GenerateScheduleInput): Promise<GenerateScheduleOutput> {
  return generateScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSchedulePrompt',
  input: {schema: GenerateScheduleInputSchema},
  output: {schema: GenerateScheduleOutputSchema},
  prompt: `You are an AI assistant specialized in generating optimized shift schedules for businesses.

  Based on the provided employee availability, demand forecasts, and organizational rules, generate a draft shift schedule.

  Employee Availability:
  {{employeeAvailability}}

  Demand Forecasts:
  {{demandForecasts}}

  Organizational Rules:
  {{organizationalRules}}

  Provide the generated shift schedule in a clear, well-formatted, and easily understandable format.
  Consider all inputs to create an optimized schedule that meets the needs of the business and its employees.
  The shift schedule should include employee IDs, shift start and end times, and roles or positions.
`,
});

const generateScheduleFlow = ai.defineFlow(
  {
    name: 'generateScheduleFlow',
    inputSchema: GenerateScheduleInputSchema,
    outputSchema: GenerateScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
