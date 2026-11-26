import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as departmentsController from './departments.controller';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.validation';

const router = Router();

router.get('/', departmentsController.list);

router.use(authenticate, authorize(Role.ADMIN));
router.post('/', validate(createDepartmentSchema), departmentsController.create);
router.patch('/:id', validate(updateDepartmentSchema), departmentsController.update);
router.delete('/:id', departmentsController.remove);

export default router;
