import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, formatted);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') || 'field';
      return sendError(res, `Duplicate value for unique ${target}.`, 409, [
        { code: err.code, target },
      ]);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Requested record was not found.', 404);
    }
    if (err.code === 'P2003') {
      return sendError(res, 'Referenced related record does not exist.', 400);
    }
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }
  return sendError(res, message, 500);
}
