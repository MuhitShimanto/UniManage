import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as adminController from './admin.controller';
import { createInstructorSchema, updateUserRoleSchema } from './admin.validation';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/users', adminController.listUsers);
router.post('/instructors', validate(createInstructorSchema), adminController.createInstructor);
router.patch('/users/:id/role', validate(updateUserRoleSchema), adminController.updateUserRole);
router.get('/dashboard-stats', adminController.dashboardStats);
router.get('/audit-logs', adminController.auditLogs);

export default router;
