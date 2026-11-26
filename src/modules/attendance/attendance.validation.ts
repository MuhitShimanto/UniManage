import { AttendanceStatus } from '@prisma/client';
import { z } from 'zod';

export const bulkAttendanceSchema = z.object({
  body: z.object({
    sectionId: z.string().min(1),
    date: z.coerce.date(),
    records: z
      .array(
        z.object({
          enrollmentId: z.string().min(1),
          status: z.nativeEnum(AttendanceStatus),
          remarks: z.string().max(200).optional(),
        })
      )
      .min(1),
  }),
});
