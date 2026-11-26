import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as resultsController from './results.controller';
import { upsertResultSchema } from './results.validation';

export const resultsRouter = Router();
resultsRouter.use(authenticate);
resultsRouter.post(
  '/',
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  validate(upsertResultSchema),
  resultsController.upsert
);
resultsRouter.patch(
  '/:id/publish',
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  resultsController.publish
);

export const transcriptsRouter = Router();
transcriptsRouter.get(
  '/me',
  authenticate,
  authorize(Role.STUDENT),
  resultsController.getMyTranscript
);
