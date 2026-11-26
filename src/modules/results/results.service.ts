import { EnrollmentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';
import { calculateGradeFromScore, calculateWeightedGpa } from '../../utils/gpa';

export async function upsertExamResult(
  actorId: string,
  actorRole: Role,
  input: {
    enrollmentId: string;
    attendanceScore: number;
    assignmentScore: number;
    midtermScore: number;
    finalScore: number;
  }
) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: input.enrollmentId, deletedAt: null },
    include: { section: { include: { instructor: true } } },
  });

  if (!enrollment) throw new AppError('Enrollment not found.', 404);
  if (actorRole === Role.INSTRUCTOR && enrollment.section.instructor.userId !== actorId) {
    throw new AppError('Forbidden: you are not the instructor for this section.', 403);
  }

  const totalScore = Number(
    (
      input.attendanceScore +
      input.assignmentScore +
      input.midtermScore +
      input.finalScore
    ).toFixed(2)
  );
  const { grade, gradePoint } = calculateGradeFromScore(totalScore);

  const result = await prisma.examResult.upsert({
    where: { enrollmentId: enrollment.id },
    update: {
      attendanceScore: input.attendanceScore,
      assignmentScore: input.assignmentScore,
      midtermScore: input.midtermScore,
      finalScore: input.finalScore,
      totalScore,
      grade,
      gradePoint,
    },
    create: {
      enrollmentId: enrollment.id,
      attendanceScore: input.attendanceScore,
      assignmentScore: input.assignmentScore,
      midtermScore: input.midtermScore,
      finalScore: input.finalScore,
      totalScore,
      grade,
      gradePoint,
    },
  });

  await recordAuditLog({
    actorId,
    action: 'RESULT_UPSERTED',
    entityType: 'ExamResult',
    entityId: result.id,
    metadata: { totalScore, grade },
  });

  return result;
}

export async function publishResult(actorId: string, actorRole: Role, resultId: string) {
  const existing = await prisma.examResult.findUnique({
    where: { id: resultId },
    include: {
      enrollment: {
        include: {
          section: { include: { instructor: true, course: true } },
          student: true,
        },
      },
    },
  });

  if (!existing) throw new AppError('Exam result not found.', 404);
  if (actorRole === Role.INSTRUCTOR && existing.enrollment.section.instructor.userId !== actorId) {
    throw new AppError('Forbidden: you cannot publish results for another instructor.', 403);
  }

  const published = await prisma.$transaction(async (tx) => {
    const updated = await tx.examResult.update({
      where: { id: resultId },
      data: { isPublished: true, publishedAt: new Date() },
    });

    await tx.enrollment.update({
      where: { id: existing.enrollmentId },
      data: { status: EnrollmentStatus.COMPLETED },
    });

    // Recalculate student's cumulative CGPA
    const allPublished = await tx.examResult.findMany({
      where: {
        isPublished: true,
        enrollment: { studentId: existing.enrollment.studentId, deletedAt: null },
      },
      include: { enrollment: { include: { section: { include: { course: true } } } } },
    });

    const cgpa = calculateWeightedGpa(
      allPublished.map((r) => ({
        credits: r.enrollment.section.course.credits,
        gradePoint: r.gradePoint,
      }))
    );

    await tx.studentProfile.update({
      where: { id: existing.enrollment.studentId },
      data: { currentCgpa: cgpa },
    });

    return updated;
  });

  await recordAuditLog({
    actorId,
    action: 'RESULT_PUBLISHED',
    entityType: 'ExamResult',
    entityId: resultId,
  });

  return published;
}

export async function getMyTranscript(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true } },
      program: { select: { code: true, name: true, totalCreditsRequired: true } },
    },
  });
  if (!student) throw new AppError('Student profile not found.', 404);

  const completedResults = await prisma.examResult.findMany({
    where: {
      isPublished: true,
      enrollment: { studentId: student.id, deletedAt: null },
    },
    include: {
      enrollment: {
        include: {
          section: {
            include: {
              course: { select: { code: true, title: true, credits: true } },
              semester: { select: { id: true, name: true, year: true } },
            },
          },
        },
      },
    },
    orderBy: { publishedAt: 'asc' },
  });

  const semesterMap = new Map<
    string,
    {
      semesterName: string;
      courses: Array<{
        code: string;
        title: string;
        credits: number;
        totalScore: number;
        grade: string;
        gradePoint: number;
      }>;
    }
  >();

  for (const r of completedResults) {
    const sem = r.enrollment.section.semester;
    const course = r.enrollment.section.course;
    if (!semesterMap.has(sem.id)) {
      semesterMap.set(sem.id, { semesterName: sem.name, courses: [] });
    }
    semesterMap.get(sem.id)!.courses.push({
      code: course.code,
      title: course.title,
      credits: course.credits,
      totalScore: r.totalScore,
      grade: r.grade,
      gradePoint: r.gradePoint,
    });
  }

  const semesters = Array.from(semesterMap.values()).map((s) => ({
    semesterName: s.semesterName,
    semesterGpa: calculateWeightedGpa(s.courses),
    creditsEarned: s.courses.filter((c) => c.gradePoint > 0).reduce((a, b) => a + b.credits, 0),
    courses: s.courses,
  }));

  const cumulativeCgpa = calculateWeightedGpa(
    completedResults.map((r) => ({
      credits: r.enrollment.section.course.credits,
      gradePoint: r.gradePoint,
    }))
  );

  return {
    student: {
      name: student.user.name,
      email: student.user.email,
      studentCode: student.studentCode,
      program: student.program,
      admissionYear: student.admissionYear,
    },
    cumulativeCgpa,
    totalCreditsCompleted: semesters.reduce((sum, s) => sum + s.creditsEarned, 0),
    semesters,
  };
}
