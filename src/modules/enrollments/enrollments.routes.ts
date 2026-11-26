import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as enrollmentsController from './enrollments.controller';
import { enrollSchema } from './enrollments.validation';

const router = Router();

router.use(authenticate, authorize(Role.STUDENT));

router.post('/', validate(enrollSchema), enrollmentsController.enroll);
router.get('/my', enrollmentsController.getMy);
router.delete('/:id', enrollmentsController.drop);

export default router;
