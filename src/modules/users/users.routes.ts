import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as usersController from './users.controller';
import { updateProfileSchema } from './users.validation';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);
router.patch('/me', validate(updateProfileSchema), usersController.updateMe);
router.patch('/me/avatar', uploadImage.single('avatar'), usersController.updateAvatar);

export default router;
