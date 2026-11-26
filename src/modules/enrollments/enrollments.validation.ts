import { z } from 'zod';

export const enrollSchema = z.object({
  body: z.object({
    sectionId: z.string().min(1, 'Section ID is required'),
  }),
});
