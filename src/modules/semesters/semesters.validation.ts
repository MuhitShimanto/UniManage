import { z } from 'zod';

export const createSemesterSchema = z.object({
  body: z.object({
    name: z.string().min(4).max(50),
    year: z.number().int().min(2000).max(2100),
    term: z.enum(['Spring', 'Summer', 'Fall']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isCurrent: z.boolean().default(false),
    registrationOpen: z.boolean().default(true),
  }),
});

export const createSectionSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    semesterId: z.string().min(1),
    instructorId: z.string().min(1),
    sectionCode: z.string().min(1).max(10).toUpperCase(),
    maxCapacity: z.number().int().min(5).max(300).default(40),
    scheduleSlot: z.string().min(3).max(60),
    room: z.string().max(30).optional(),
  }),
});

export const updateSectionSchema = z.object({
  body: z.object({
    instructorId: z.string().min(1).optional(),
    sectionCode: z.string().min(1).max(10).toUpperCase().optional(),
    maxCapacity: z.number().int().min(5).max(300).optional(),
    scheduleSlot: z.string().min(3).max(60).optional(),
    room: z.string().max(30).optional().nullable(),
  }),
});
