import { cache } from '../../config/cache';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';

const CACHE_PREFIX = 'departments:';

export async function createDepartment(
  data: { code: string; name: string; description?: string },
  actorId: string
) {
  const dept = await prisma.department.create({ data });
  await cache.invalidatePrefix(CACHE_PREFIX);
  await recordAuditLog({
    actorId,
    action: 'DEPARTMENT_CREATED',
    entityType: 'Department',
    entityId: dept.id,
    metadata: { code: dept.code },
  });
  return dept;
}

export async function listDepartments() {
  const cacheKey = `${CACHE_PREFIX}all`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { code: 'asc' },
    include: {
      _count: { select: { programs: true, courses: true, instructors: true } },
    },
  });
  await cache.set(cacheKey, departments, 180);
  return departments;
}

export async function updateDepartment(
  id: string,
  data: { name?: string; description?: string },
  actorId: string
) {
  const existing = await prisma.department.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError('Department not found.', 404);

  const updated = await prisma.department.update({ where: { id }, data });
  await cache.invalidatePrefix(CACHE_PREFIX);
  await recordAuditLog({
    actorId,
    action: 'DEPARTMENT_UPDATED',
    entityType: 'Department',
    entityId: id,
  });
  return updated;
}

export async function softDeleteDepartment(id: string, actorId: string) {
  const existing = await prisma.department.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError('Department not found.', 404);

  await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
  await cache.invalidatePrefix(CACHE_PREFIX);
  await recordAuditLog({
    actorId,
    action: 'DEPARTMENT_DELETED',
    entityType: 'Department',
    entityId: id,
  });
}
