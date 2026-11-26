import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';

export async function createProgram(
  data: {
    code: string;
    name: string;
    totalCreditsRequired: number;
    departmentId: string;
  },
  actorId: string
) {
  const dept = await prisma.department.findFirst({
    where: { id: data.departmentId, deletedAt: null },
  });
  if (!dept) throw new AppError('Department not found.', 404);

  const program = await prisma.program.create({ data });
  await recordAuditLog({
    actorId,
    action: 'PROGRAM_CREATED',
    entityType: 'Program',
    entityId: program.id,
  });
  return program;
}

export async function listPrograms(departmentId?: string) {
  return prisma.program.findMany({
    where: {
      deletedAt: null,
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: { select: { id: true, code: true, name: true } },
    },
    orderBy: { code: 'asc' },
  });
}
