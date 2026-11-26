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
