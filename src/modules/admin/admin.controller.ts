import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { PaginationMeta, sendSuccess } from '../../utils/apiResponse';
import * as adminService from './admin.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const role = req.query.role as Role | undefined;
  const q = req.query.q as string | undefined;

  const result = await adminService.listUsers({ page, limit, role, q });
  return sendSuccess(
    res,
    'Users retrieved successfully',
    result.items,
    200,
    result.meta as PaginationMeta
  );
});

export const createInstructor = asyncHandler(async (req: Request, res: Response) => {
  const instructor = await adminService.createInstructorAccount(req.body, req.user!.userId);
  return sendSuccess(res, 'Instructor account created successfully', instructor, 201);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const updated = await adminService.updateUserRole(
    String(req.params.id),
    req.body.role,
    req.user!.userId
  );
  return sendSuccess(res, 'User role updated successfully', updated);
});

export const dashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  return sendSuccess(res, 'Dashboard statistics retrieved successfully', stats);
});

export const auditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const result = await adminService.getAuditLogs(page, limit);
  return sendSuccess(
    res,
    'Audit logs retrieved successfully',
    result.items,
    200,
    result.meta as PaginationMeta
  );
});
