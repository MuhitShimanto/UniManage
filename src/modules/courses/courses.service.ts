import { Prisma } from '@prisma/client';
import { cache } from '../../config/cache';
import { uploadBufferToCloudinary } from '../../config/cloudinary';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';

const CACHE_PREFIX = 'courses:';

export async function createCourse(
  data: {
    code: string;
    title: string;
    description?: string;
    credits: number;
    departmentId: string;
    programId?: string;
    prerequisiteIds?: string[];
  },
  actorId: string
) {
  const { prerequisiteIds = [], ...courseData } = data;

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({ data: courseData });
    if (prerequisiteIds.length > 0) {
      await tx.coursePrerequisite.createMany({
        data: prerequisiteIds.map((prereqId) => ({
          courseId: created.id,
          prerequisiteId: prereqId,
        })),
      });
    }
    return created;
  });

  await cache.invalidatePrefix(CACHE_PREFIX);
  await recordAuditLog({
    actorId,
    action: 'COURSE_CREATED',
    entityType: 'Course',
    entityId: course.id,
    metadata: { code: course.code },
  });

  return course;
}

export async function listCourses(params: {
  page: number;
  limit: number;
  q?: string;
  departmentId?: string;
  programId?: string;
  sortBy: 'code' | 'title' | 'credits' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}) {
  const cacheKey = `${CACHE_PREFIX}${JSON.stringify(params)}`;
  const cached = await cache.get<{ items: unknown[]; meta: unknown }>(cacheKey);
  if (cached) return cached;

  const where: Prisma.CourseWhereInput = {
    deletedAt: null,
    ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    ...(params.programId ? { programId: params.programId } : {}),
    ...(params.q
      ? {
          OR: [
            { code: { contains: params.q, mode: 'insensitive' } },
            { title: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const skip = (params.page - 1) * params.limit;
  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: { [params.sortBy]: params.sortOrder },
      include: {
        department: { select: { id: true, code: true, name: true } },
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, code: true, title: true } },
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const result = {
    items,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

export async function getCourseById(id: string) {
  const course = await prisma.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      department: { select: { id: true, code: true, name: true } },
      program: { select: { id: true, code: true, name: true } },
      prerequisites: {
        include: {
          prerequisite: { select: { id: true, code: true, title: true, credits: true } },
        },
      },
    },
  });
  if (!course) throw new AppError('Course not found.', 404);
  return course;
}

export async function updateCourse(
  id: string,
  data: {
    title?: string;
    description?: string;
    credits?: number;
    prerequisiteIds?: string[];
  },
  actorId: string
) {
  const existing = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError('Course not found.', 404);

  const { prerequisiteIds, ...updateData } = data;

  const updated = await prisma.$transaction(async (tx) => {
    const course = await tx.course.update({ where: { id }, data: updateData });
    if (prerequisiteIds) {
      await tx.coursePrerequisite.deleteMany({ where: { courseId: id } });
      if (prerequisiteIds.length > 0) {
        await tx.coursePrerequisite.createMany({
          data: prerequisiteIds
            .filter((p) => p !== id)
            .map((prerequisiteId) => ({ courseId: id, prerequisiteId })),
        });
      }
    }
    return course;
  });

  await cache.invalidatePrefix(CACHE_PREFIX);
  await recordAuditLog({
    actorId,
    action: 'COURSE_UPDATED',
    entityType: 'Course',
    entityId: id,
  });
  return updated;
}

export async function uploadCourseSyllabus(
  id: string,
  file: Express.Multer.File | undefined,
  actorId: string
) {
  if (!file) throw new AppError('Syllabus PDF file is required.', 400);

  const existing = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError('Course not found.', 404);

  const uploaded = await uploadBufferToCloudinary(
    file.buffer,
    'university-management/syllabi',
    'raw'
  );

  const updated = await prisma.course.update({
    where: { id },
    data: { syllabusUrl: uploaded.url },
  });

  await cache.invalidatePrefix(CACHE_PREFIX);
  await recordAuditLog({
    actorId,
    action: 'COURSE_SYLLABUS_UPLOADED',
    entityType: 'Course',
    entityId: id,
  });
  return updated;
}

export async function deleteCourse(id: string, actorId: string) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) throw new AppError('Course not found.', 404);

  const sectionCount = await prisma.section.count({ where: { courseId: id } });
  if (sectionCount > 0) {
    throw new AppError('Cannot delete a course that has existing sections.', 409);
  }

  await prisma.course.delete({ where: { id } });
  await cache.invalidatePrefix(CACHE_PREFIX);
  await recordAuditLog({
    actorId,
    action: 'COURSE_DELETED',
    entityType: 'Course',
    entityId: id,
  });
}
