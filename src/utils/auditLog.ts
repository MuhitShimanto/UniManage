import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export async function recordAuditLog(params: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch {
    // Audit logging should not crash primary business operations
  }
}
