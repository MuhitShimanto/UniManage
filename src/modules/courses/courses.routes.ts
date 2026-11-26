import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { uploadPdf } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as coursesController from './courses.controller';
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from './courses.validation';

const router = Router();

router.get('/', validate(listCoursesQuerySchema), coursesController.list);
router.get('/:id', coursesController.getOne);

router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createCourseSchema),
  coursesController.create
);
router.patch(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate(updateCourseSchema),
  coursesController.update
);
router.patch(
  '/:id/syllabus',
  authenticate,
  authorize(Role.ADMIN, Role.INSTRUCTOR),
  uploadPdf.single('syllabus'),
  coursesController.uploadSyllabus
);
router.delete('/:id', authenticate, authorize(Role.ADMIN), coursesController.remove);

export default router;
