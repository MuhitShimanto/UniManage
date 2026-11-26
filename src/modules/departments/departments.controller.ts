import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as departmentsService from './departments.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const dept = await departmentsService.createDepartment(req.body, req.user!.userId);
  return sendSuccess(res, 'Department created successfully', dept, 201);
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await departmentsService.listDepartments();
  return sendSuccess(res, 'Departments retrieved successfully', departments);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const dept = await departmentsService.updateDepartment(
    req.params.id,
    req.body,
    req.user!.userId
  );
  return sendSuccess(res, 'Department updated successfully', dept);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentsService.softDeleteDepartment(req.params.id, req.user!.userId);
  return sendSuccess(res, 'Department soft-deleted successfully', null);
});
