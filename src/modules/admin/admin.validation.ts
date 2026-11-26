import { Role } from '@prisma/client';
import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(Role),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createInstructorSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    departmentId: z.string().min(1),
    designation: z.string().min(2).max(60).default('Lecturer'),
  }),
});
