import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    title: z.string().min(3).max(150),
    description: z.string().max(1000).optional(),
    credits: z.number().int().min(1).max(6).default(3),
    departmentId: z.string().min(1),
    programId: z.string().optional(),
    prerequisiteIds: z.array(z.string()).optional(),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(150).optional(),
    description: z.string().max(1000).optional(),
    credits: z.number().int().min(1).max(6).optional(),
    prerequisiteIds: z.array(z.string()).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listCoursesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    q: z.string().optional(),
    departmentId: z.string().optional(),
    programId: z.string().optional(),
    sortBy: z.enum(['code', 'title', 'credits', 'createdAt']).default('code'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});
