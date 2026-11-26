import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as semestersService from './semesters.service';

export const createSemester = asyncHandler(async (req: Request, res: Response) => {
  const semester = await semestersService.createSemester(req.body, req.user!.userId);
  return sendSuccess(res, 'Semester created successfully', semester, 201);
});

export const listSemesters = asyncHandler(async (_req: Request, res: Response) => {
  const semesters = await semestersService.listSemesters();
  return sendSuccess(res, 'Semesters retrieved successfully', semesters);
});

export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await semestersService.createSection(req.body, req.user!.userId);
  return sendSuccess(res, 'Section created successfully', section, 201);
});

export const listSections = asyncHandler(async (req: Request, res: Response) => {
  const sections = await semestersService.listSections({
    semesterId: req.query.semesterId as string | undefined,
    courseId: req.query.courseId as string | undefined,
    instructorId: req.query.instructorId as string | undefined,
  });
  return sendSuccess(res, 'Sections retrieved successfully', sections);
});

export const getSectionEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const section = await semestersService.getSectionEnrollments(
    String(req.params.id),
    req.user!.userId,
    req.user!.role
  );
  return sendSuccess(res, 'Section enrollments retrieved successfully', section);
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await semestersService.updateSection(
    String(req.params.id),
    req.body,
    req.user!.userId
  );
  return sendSuccess(res, 'Section updated successfully', section);
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  await semestersService.deleteSection(String(req.params.id), req.user!.userId);
  return sendSuccess(res, 'Section deleted successfully', null);
});
