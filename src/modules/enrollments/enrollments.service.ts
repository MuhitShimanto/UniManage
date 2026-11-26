import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';

const MAX_CREDITS_PER_SEMESTER = 18;

function parseScheduleSlot(slot: string): { days: string[]; startMin: number; endMin: number } | null {
  const match = slot
    .trim()
    .toUpperCase()
    .match(/^([A-Z-]+)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const days = match[1].split('-').filter(Boolean);
  const startMin = Number(match[2]) * 60 + Number(match[3]);
  const endMin = Number(match[4]) * 60 + Number(match[5]);
  if (Number.isNaN(startMin) || Number.isNaN(endMin) || startMin >= endMin) return null;

  return { days, startMin, endMin };
}

function hasScheduleClash(slotA: string, slotB: string): boolean {
  if (slotA.trim().toUpperCase() === slotB.trim().toUpperCase()) return true;
  const a = parseScheduleSlot(slotA);
  const b = parseScheduleSlot(slotB);
  if (!a || !b) return false;

  const sharesDay = a.days.some((d) => b.days.includes(d));
  if (!sharesDay) return false;

  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export async function enrollInSection(userId: string, sectionId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) {
    throw new AppError('Student profile not found for this user.', 404);
  }

  const enrollment = await prisma.$transaction(async (tx) => {
    const section = await tx.section.findFirst({
      where: { id: sectionId, deletedAt: null },
      include: {
        semester: true,
        course: {
          include: {
            prerequisites: {
              include: { prerequisite: { select: { id: true, code: true, title: true } } },
            },
          },
        },
      },
    });

    if (!section) throw new AppError('Section not found.', 404);
    if (!section.semester.registrationOpen) {
      throw new AppError(`Course registration is closed for ${section.semester.name}.`, 400);
    }

    // Check duplicate enrollment in same course for the same semester
    const existingSameCourse = await tx.enrollment.findFirst({
      where: {
        studentId: student.id,
        deletedAt: null,
        status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED] },
        section: {
          courseId: section.courseId,
          semesterId: section.semesterId,
        },
      },
    });
    if (existingSameCourse) {
      throw new AppError('You are already enrolled in this course for the current semester.', 409);
    }

    // Check prerequisites
    if (section.course.prerequisites.length > 0) {
      const prereqCourseIds = section.course.prerequisites.map((p) => p.prerequisiteId);
      const completedPrereqs = await tx.enrollment.findMany({
        where: {
          studentId: student.id,
          status: EnrollmentStatus.COMPLETED,
          section: { courseId: { in: prereqCourseIds } },
          examResult: { isPublished: true, gradePoint: { gt: 0 } },
        },
        include: { section: { select: { courseId: true } } },
      });

      const passedCourseIds = new Set(completedPrereqs.map((e) => e.section.courseId));
      const missing = section.course.prerequisites.filter(
        (p) => !passedCourseIds.has(p.prerequisiteId)
      );
      if (missing.length > 0) {
        const codes = missing.map((m) => m.prerequisite.code).join(', ');
        throw new AppError(`Missing required prerequisite(s): ${codes}`, 400);
      }
    }

    // Check max credit limit & schedule clashes for the semester
    const currentEnrollments = await tx.enrollment.findMany({
      where: {
        studentId: student.id,
        status: EnrollmentStatus.ENROLLED,
        deletedAt: null,
        section: { semesterId: section.semesterId },
      },
      include: {
        section: {
          include: { course: { select: { code: true, credits: true } } },
        },
      },
    });

    const clashingEnrollment = currentEnrollments.find((e) =>
      hasScheduleClash(e.section.scheduleSlot, section.scheduleSlot)
    );
    if (clashingEnrollment) {
      throw new AppError(
        `Schedule conflict with ${clashingEnrollment.section.course.code} (${clashingEnrollment.section.scheduleSlot}).`,
        409
      );
    }

    const currentCredits = currentEnrollments.reduce(
      (sum, e) => sum + e.section.course.credits,
      0
    );
    if (currentCredits + section.course.credits > MAX_CREDITS_PER_SEMESTER) {
      throw new AppError(
        `Credit limit exceeded. Maximum allowed is ${MAX_CREDITS_PER_SEMESTER} credits per semester.`,
        400
      );
    }

    // Atomic capacity increment to prevent race conditions
    const capacityUpdate = await tx.section.updateMany({
      where: {
        id: section.id,
        enrolledCount: { lt: section.maxCapacity },
      },
      data: {
        enrolledCount: { increment: 1 },
      },
    });

    if (capacityUpdate.count === 0) {
      throw new AppError('Section is already at maximum capacity.', 409);
    }

    return tx.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: section.id,
        status: EnrollmentStatus.ENROLLED,
      },
      include: {
        section: {
          include: {
            course: { select: { code: true, title: true, credits: true } },
            semester: { select: { name: true } },
          },
        },
      },
    });
  });

  await recordAuditLog({
    actorId: userId,
    action: 'COURSE_ENROLLED',
    entityType: 'Enrollment',
    entityId: enrollment.id,
    metadata: { sectionId },
  });

  return enrollment;
}

export async function dropEnrollment(userId: string, enrollmentId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) throw new AppError('Student profile not found.', 404);

  const dropped = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findFirst({
      where: { id: enrollmentId, studentId: student.id, deletedAt: null },
      include: { section: { include: { semester: true } } },
    });

    if (!enrollment) throw new AppError('Enrollment not found.', 404);
    if (enrollment.status !== EnrollmentStatus.ENROLLED) {
      throw new AppError('Only active enrollments can be dropped.', 400);
    }
    if (!enrollment.section.semester.registrationOpen) {
      throw new AppError('Drop period has closed for this semester.', 400);
    }

    const updated = await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { status: EnrollmentStatus.DROPPED, droppedAt: new Date() },
    });

    await tx.section.update({
      where: { id: enrollment.sectionId },
      data: { enrolledCount: { decrement: 1 } },
    });

    return updated;
  });

  await recordAuditLog({
    actorId: userId,
    action: 'COURSE_DROPPED',
    entityType: 'Enrollment',
    entityId: enrollmentId,
  });

  return dropped;
}

export async function getMyEnrollments(userId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) throw new AppError('Student profile not found.', 404);

  return prisma.enrollment.findMany({
    where: { studentId: student.id, deletedAt: null },
    include: {
      section: {
        include: {
          course: { select: { id: true, code: true, title: true, credits: true } },
          semester: { select: { id: true, name: true, isCurrent: true } },
          instructor: { include: { user: { select: { name: true, email: true } } } },
        },
      },
      examResult: true,
    },
    orderBy: { enrolledAt: 'desc' },
  });
}
