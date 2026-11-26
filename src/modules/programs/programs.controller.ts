import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as programsService from './programs.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const program = await programsService.createProgram(req.body, req.user!.userId);
  return sendSuccess(res, 'Program created successfully', program, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const departmentId = req.query.departmentId as string | undefined;
  const programs = await programsService.listPrograms(departmentId);
  return sendSuccess(res, 'Programs retrieved successfully', programs);
});
