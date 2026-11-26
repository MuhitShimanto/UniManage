import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { PaginationMeta, sendSuccess } from '../../utils/apiResponse';
import * as coursesService from './courses.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.createCourse(req.body, req.user!.userId);
  return sendSuccess(res, 'Course created successfully', course, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await coursesService.listCourses(
    req.query as unknown as Parameters<typeof coursesService.listCourses>[0]
  );
  return sendSuccess(
    res,
    'Courses retrieved successfully',
    result.items,
    200,
    result.meta as PaginationMeta
  );
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.getCourseById(String(req.params.id));
  return sendSuccess(res, 'Course retrieved successfully', course);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.updateCourse(
    String(req.params.id),
    req.body,
    req.user!.userId
  );
  return sendSuccess(res, 'Course updated successfully', course);
});

export const uploadSyllabus = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.uploadCourseSyllabus(
    String(req.params.id),
    req.file,
    req.user!.userId
  );
  return sendSuccess(res, 'Course syllabus uploaded successfully', course);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await coursesService.deleteCourse(String(req.params.id), req.user!.userId);
  return sendSuccess(res, 'Course deleted successfully', null);
});
