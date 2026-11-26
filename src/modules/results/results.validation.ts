import { z } from 'zod';

export const upsertResultSchema = z.object({
  body: z.object({
    enrollmentId: z.string().min(1),
    attendanceScore: z.number().min(0).max(10).default(0),
    assignmentScore: z.number().min(0).max(20).default(0),
    midtermScore: z.number().min(0).max(30).default(0),
    finalScore: z.number().min(0).max(40).default(0),
  }),
});
