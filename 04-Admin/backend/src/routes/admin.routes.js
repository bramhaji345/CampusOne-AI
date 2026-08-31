import { Router } from 'express';
import { auth, role } from '../middleware/auth.js';
import { asyncHandler as ah } from '../middleware/async.js';
import * as admin from '../controllers/admin.controller.js';
import * as campus from '../controllers/campus.controller.js';

/**
 * Merge into the main app:
 *   import adminRoutes from './routes/admin.routes.js';
 *   app.use('/api', adminRoutes);
 */
const router = Router();
router.get('/admin/students', auth, role('admin'), ah(admin.adminStudents));
router.post('/admin/students', auth, role('admin'), ah(admin.createStudent));
router.delete('/admin/students/:studentId', auth, role('admin'), ah(admin.deleteStudent));
router.get('/admin/faculty', auth, role('admin'), ah(admin.adminFaculty));
router.post('/admin/faculty', auth, role('admin'), ah(admin.createFaculty));
router.get('/admin/stats', auth, role('admin'), ah(admin.adminStats));
router.get('/admin/analytics', auth, role('admin'), ah(admin.adminAnalytics));
router.get('/admin/departments', auth, role('admin'), ah(admin.departments));
router.get('/certificates', auth, ah(campus.listCertificates));
router.patch('/certificates/:id', auth, role('admin'), ah(campus.reviewCertificate));
router.get('/notifications', auth, ah(campus.listNotifications));
router.post('/notifications', auth, role('faculty', 'admin'), ah(campus.createNotification));
router.delete('/notifications/:id', auth, role('admin'), ah(campus.deleteNotification));
router.patch('/profile', auth, ah(admin.updateProfile));
export default router;
