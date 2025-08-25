'use server';

import { generateSchedule, type GenerateScheduleInput } from '@/ai/flows/generate-schedule';

export async function runGenerateSchedule(input: GenerateScheduleInput) {
  try {
    const result = await generateSchedule(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error generating schedule:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to generate schedule. ${errorMessage}` };
  }
}
