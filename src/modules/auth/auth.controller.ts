import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as authService from './auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerStudent(req.body, req.ip);
  return sendSuccess(res, 'Student registered successfully', result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginWithPassword(req.body, req.ip);
  return sendSuccess(res, 'Login successful', result);
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginWithGoogle(req.body, req.ip);
  return sendSuccess(res, 'Google login successful', result);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAuthTokens(req.body.refreshToken);
  return sendSuccess(res, 'Tokens refreshed successfully', tokens);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutUser(req.user!.userId);
  return sendSuccess(res, 'Logged out successfully', null);
});
