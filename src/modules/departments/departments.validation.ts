import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(10).toUpperCase(),
    name: z.string().min(3).max(120),
    description: z.string().max(500).optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(120).optional(),
    description: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});
