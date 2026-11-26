import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as programsController from './programs.controller';
import { createProgramSchema } from './programs.validation';

const router = Router();

router.get('/', programsController.list);
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createProgramSchema),
  programsController.create
);

export default router;
