import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication required. Please provide a Bearer token.', 401));
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deletedAt: null, isActive: true },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      next(new AppError('User account not found or deactivated.', 401));
      return;
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  } catch {
    next(new AppError('Invalid or expired access token.', 401));
  }
}
