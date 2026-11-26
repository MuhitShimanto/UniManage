import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';

export async function createSemester(
  data: {
    name: string;
    year: number;
    term: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    registrationOpen: boolean;
  },
  actorId: string
) {
  const semester = await prisma.$transaction(async (tx) => {
    if (data.isCurrent) {
      await tx.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    }
    return tx.semester.create({ data });
  });

  await recordAuditLog({
    actorId,
    action: 'SEMESTER_CREATED',
    entityType: 'Semester',
    entityId: semester.id,
  });
  return semester;
}

export async function listSemesters() {
  return prisma.semester.findMany({
    where: { deletedAt: null },
    orderBy: [{ year: 'desc' }, { startDate: 'desc' }],
  });
}

export async function createSection(
  data: {
    courseId: string;
    semesterId: string;
    instructorId: string;
    sectionCode: string;
    maxCapacity: number;
    scheduleSlot: string;
    room?: string;
  },
  actorId: string
) {
  const [course, semester, instructor] = await Promise.all([
    prisma.course.findFirst({ where: { id: data.courseId, deletedAt: null } }),
    prisma.semester.findFirst({ where: { id: data.semesterId, deletedAt: null } }),
    prisma.instructorProfile.findUnique({ where: { id: data.instructorId } }),
  ]);

  if (!course) throw new AppError('Course not found.', 404);
  if (!semester) throw new AppError('Semester not found.', 404);
  if (!instructor) throw new AppError('Instructor profile not found.', 404);

  const section = await prisma.section.create({ data });
  await recordAuditLog({
    actorId,
    action: 'SECTION_CREATED',
    entityType: 'Section',
    entityId: section.id,
  });
  return section;
}

export async function listSections(filters: {
  semesterId?: string;
  courseId?: string;
  instructorId?: string;
}) {
  return prisma.section.findMany({
    where: {
      deletedAt: null,
      ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.instructorId ? { instructorId: filters.instructorId } : {}),
    },
    include: {
      course: { select: { id: true, code: true, title: true, credits: true } },
      semester: { select: { id: true, name: true, isCurrent: true, registrationOpen: true } },
      instructor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSectionEnrollments(sectionId: string, actorId: string, actorRole: Role) {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, deletedAt: null },
    include: {
      course: { select: { id: true, code: true, title: true, credits: true, syllabusUrl: true } },
      semester: { select: { id: true, name: true, isCurrent: true } },
      instructor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      enrollments: {
        where: { deletedAt: null },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          examResult: true,
          attendances: {
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { enrolledAt: 'asc' },
      },
    },
  });

  if (!section) throw new AppError('Section not found.', 404);
  if (actorRole === Role.INSTRUCTOR && section.instructor.userId !== actorId) {
    throw new AppError('Forbidden: you are not assigned to this section.', 403);
  }

  return section;
}

export async function updateSection(
  sectionId: string,
  data: {
    instructorId?: string;
    sectionCode?: string;
    maxCapacity?: number;
    scheduleSlot?: string;
    room?: string | null;
  },
  actorId: string
) {
  const existing = await prisma.section.findFirst({ where: { id: sectionId, deletedAt: null } });
  if (!existing) throw new AppError('Section not found.', 404);

  if (data.instructorId) {
    const instructor = await prisma.instructorProfile.findUnique({
      where: { id: data.instructorId },
    });
    if (!instructor) throw new AppError('Instructor profile not found.', 404);
  }

  if (data.maxCapacity !== undefined && data.maxCapacity < existing.enrolledCount) {
    throw new AppError(
      `Max capacity cannot be less than currently enrolled students (${existing.enrolledCount}).`,
      400
    );
  }

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data,
    include: {
      course: { select: { id: true, code: true, title: true, credits: true } },
      semester: { select: { id: true, name: true, isCurrent: true, registrationOpen: true } },
      instructor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  await recordAuditLog({
    actorId,
    action: 'SECTION_UPDATED',
    entityType: 'Section',
    entityId: sectionId,
  });

  return updated;
}

export async function deleteSection(sectionId: string, actorId: string) {
  const existing = await prisma.section.findFirst({ where: { id: sectionId, deletedAt: null } });
  if (!existing) throw new AppError('Section not found.', 404);

  const enrollmentCount = await prisma.enrollment.count({
    where: { sectionId, deletedAt: null },
  });
  if (enrollmentCount > 0) {
    throw new AppError('Cannot delete a section that has enrolled students.', 409);
  }

  await prisma.section.delete({ where: { id: sectionId } });
  await recordAuditLog({
    actorId,
    action: 'SECTION_DELETED',
    entityType: 'Section',
    entityId: sectionId,
  });
}
