import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as enrollmentsService from './enrollments.service';

export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await enrollmentsService.enrollInSection(
    req.user!.userId,
    req.body.sectionId
  );
  return sendSuccess(res, 'Enrolled in course section successfully', enrollment, 201);
});

export const drop = asyncHandler(async (req: Request, res: Response) => {
  const dropped = await enrollmentsService.dropEnrollment(
    req.user!.userId,
    String(req.params.id)
  );
  return sendSuccess(res, 'Course dropped successfully', dropped);
});

export const getMy = asyncHandler(async (req: Request, res: Response) => {
  const enrollments = await enrollmentsService.getMyEnrollments(req.user!.userId);
  return sendSuccess(res, 'Enrollments retrieved successfully', enrollments);
});
