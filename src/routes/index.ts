import { Router } from 'express';
import adminRoutes from '../modules/admin/admin.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import authRoutes from '../modules/auth/auth.routes';
import coursesRoutes from '../modules/courses/courses.routes';
import departmentsRoutes from '../modules/departments/departments.routes';
import enrollmentsRoutes from '../modules/enrollments/enrollments.routes';
import paymentsRoutes from '../modules/payments/payments.routes';
import programsRoutes from '../modules/programs/programs.routes';
import { resultsRouter, transcriptsRouter } from '../modules/results/results.routes';
import { sectionRouter, semesterRouter } from '../modules/semesters/semesters.routes';
import usersRoutes from '../modules/users/users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/programs', programsRoutes);
router.use('/courses', coursesRoutes);
router.use('/semesters', semesterRouter);
router.use('/sections', sectionRouter);
router.use('/enrollments', enrollmentsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/results', resultsRouter);
router.use('/transcripts', transcriptsRouter);
router.use('/payments', paymentsRoutes);
router.use('/admin', adminRoutes);

export default router;
