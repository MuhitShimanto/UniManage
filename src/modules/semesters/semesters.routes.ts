import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as semestersController from './semesters.controller';
import { createSectionSchema, createSemesterSchema } from './semesters.validation';

export const semesterRouter = Router();
semesterRouter.get('/', semestersController.listSemesters);
semesterRouter.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createSemesterSchema),
  semestersController.createSemester
);

export const sectionRouter = Router();
sectionRouter.get('/', semestersController.listSections);
sectionRouter.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createSectionSchema),
  semestersController.createSection
);
