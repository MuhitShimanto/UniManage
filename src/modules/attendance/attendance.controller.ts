import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as attendanceService from './attendance.service';

export const markBulk = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.markBulkAttendance(
    req.user!.userId,
    req.user!.role,
    req.body
  );
  return sendSuccess(res, 'Attendance recorded successfully', result, 201);
});

export const getMySectionAttendance = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.getSectionAttendanceForStudent(
    req.user!.userId,
    String(req.params.sectionId)
  );
  return sendSuccess(res, 'Attendance retrieved successfully', result);
});
