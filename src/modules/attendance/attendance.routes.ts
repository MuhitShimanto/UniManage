import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as attendanceController from './attendance.controller';
import { bulkAttendanceSchema } from './attendance.validation';

const router = Router();

router.use(authenticate);

router.post(
  '/bulk',
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  validate(bulkAttendanceSchema),
  attendanceController.markBulk
);
router.get(
  '/student/:sectionId',
  authorize(Role.STUDENT),
  attendanceController.getMySectionAttendance
);

export default router;
