import { z } from 'zod';

export const createProgramSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(20).toUpperCase(),
    name: z.string().min(3).max(150),
    totalCreditsRequired: z.number().int().min(30).max(200).default(120),
    departmentId: z.string().min(1),
  }),
});
