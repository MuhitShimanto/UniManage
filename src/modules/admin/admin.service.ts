import { PaymentStatus, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';

export async function listUsers(params: {
  page: number;
  limit: number;
  role?: Role;
  q?: string;
}) {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(params.role ? { role: params.role } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: 'insensitive' } },
            { email: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const skip = (params.page - 1) * params.limit;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function createInstructorAccount(
  data: {
    name: string;
    email: string;
    password: string;
    departmentId: string;
    designation: string;
  },
  actorId: string
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already exists.', 409);

  const dept = await prisma.department.findFirst({
    where: { id: data.departmentId, deletedAt: null },
  });
  if (!dept) throw new AppError('Department not found.', 404);

  const passwordHash = await bcrypt.hash(data.password, 12);
  const employeeCode = `FAC-${dept.code}-${Math.floor(100 + Math.random() * 900)}`;

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: Role.INSTRUCTOR,
      },
    });
    const profile = await tx.instructorProfile.create({
      data: {
        userId: user.id,
        employeeCode,
        departmentId: dept.id,
        designation: data.designation,
      },
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      instructorProfile: profile,
    };
  });

  await recordAuditLog({
    actorId,
    action: 'INSTRUCTOR_CREATED',
    entityType: 'User',
    entityId: created.id,
  });

  return created;
}

export async function updateUserRole(targetUserId: string, role: Role, actorId: string) {
  const user = await prisma.user.findFirst({
    where: { id: targetUserId, deletedAt: null },
  });
  if (!user) throw new AppError('User not found.', 404);

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });

  await recordAuditLog({
    actorId,
    action: 'USER_ROLE_UPDATED',
    entityType: 'User',
    entityId: targetUserId,
    metadata: { oldRole: user.role, newRole: role },
  });

  return updated;
}

export async function getDashboardStats() {
  const [
    totalStudents,
    totalInstructors,
    totalCourses,
    totalEnrollments,
    revenueAggregate,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.STUDENT, deletedAt: null } }),
    prisma.user.count({ where: { role: Role.INSTRUCTOR, deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.enrollment.count({ where: { deletedAt: null } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return {
    totalStudents,
    totalInstructors,
    totalCourses,
    totalEnrollments,
    totalPaidTransactions: revenueAggregate._count.id,
    totalRevenueBdt: revenueAggregate._sum.amount ?? 0,
  };
}

export async function getAuditLogs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, email: true, role: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
