import { AttendanceStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';

export async function markBulkAttendance(
  actorId: string,
  actorRole: Role,
  input: {
    sectionId: string;
    date: Date;
    records: Array<{ enrollmentId: string; status: AttendanceStatus; remarks?: string }>;
  }
) {
  const section = await prisma.section.findFirst({
    where: { id: input.sectionId, deletedAt: null },
    include: { instructor: true },
  });
  if (!section) throw new AppError('Section not found.', 404);

  if (actorRole === Role.INSTRUCTOR && section.instructor.userId !== actorId) {
    throw new AppError('Forbidden: you are not assigned to this section.', 403);
  }

  const normalizedDate = new Date(input.date.toISOString().split('T')[0] + 'T00:00:00.000Z');

  const results = await prisma.$transaction(
    input.records.map((rec) =>
      prisma.attendance.upsert({
        where: {
          enrollmentId_date: {
            enrollmentId: rec.enrollmentId,
            date: normalizedDate,
          },
        },
        update: { status: rec.status, remarks: rec.remarks },
        create: {
          enrollmentId: rec.enrollmentId,
          date: normalizedDate,
          status: rec.status,
          remarks: rec.remarks,
        },
      })
    )
  );

  return { count: results.length, date: normalizedDate, records: results };
}

export async function getSectionAttendanceForStudent(userId: string, sectionId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) throw new AppError('Student profile not found.', 404);

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, sectionId, deletedAt: null },
  });
  if (!enrollment) throw new AppError('Enrollment not found for this section.', 404);

  const attendances = await prisma.attendance.findMany({
    where: { enrollmentId: enrollment.id },
    orderBy: { date: 'desc' },
  });

  const total = attendances.length;
  const presentCount = attendances.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
  ).length;

  return {
    totalClasses: total,
    attendedClasses: presentCount,
    attendancePercentage: total > 0 ? Number(((presentCount / total) * 100).toFixed(2)) : 0,
    records: attendances,
  };
}
