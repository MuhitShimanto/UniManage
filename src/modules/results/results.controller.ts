import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as resultsService from './results.service';

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const result = await resultsService.upsertExamResult(
    req.user!.userId,
    req.user!.role,
    req.body
  );
  return sendSuccess(res, 'Exam result saved successfully', result);
});

export const publish = asyncHandler(async (req: Request, res: Response) => {
  const result = await resultsService.publishResult(
    req.user!.userId,
    req.user!.role,
    String(req.params.id)
  );
  return sendSuccess(res, 'Exam result published and CGPA updated', result);
});

export const getMyTranscript = asyncHandler(async (req: Request, res: Response) => {
  const transcript = await resultsService.getMyTranscript(req.user!.userId);
  return sendSuccess(res, 'Academic transcript generated successfully', transcript);
});
