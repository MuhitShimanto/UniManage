import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as usersService from './users.service';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const profile = await usersService.getMyProfile(req.user!.userId);
  return sendSuccess(res, 'Profile retrieved successfully', profile);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const updated = await usersService.updateMyProfile(req.user!.userId, req.body);
  return sendSuccess(res, 'Profile updated successfully', updated);
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const updated = await usersService.updateMyAvatar(req.user!.userId, req.file);
  return sendSuccess(res, 'Avatar uploaded successfully', updated);
});
