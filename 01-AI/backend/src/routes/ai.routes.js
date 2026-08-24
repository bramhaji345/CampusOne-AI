import { Router } from 'express';
import { auth, role } from '../middleware/auth.js';
import { asyncHandler as ah } from '../middleware/async.js';
import { aiResults, aiAttendance } from '../controllers/academic.controller.js';
import { adminAnalytics } from '../controllers/admin.controller.js';

/**
 * Merge into the main app:
 *   import aiRoutes from './routes/ai.routes.js';
 *   app.use('/api', aiRoutes);
 */
const router = Router();
router.get('/results/ai-analysis', auth, role('student'), ah(aiResults));
router.get('/attendance/ai-analysis', auth, role('student'), ah(aiAttendance));
router.get('/admin/analytics', auth, role('admin'), ah(adminAnalytics));
export default router;
