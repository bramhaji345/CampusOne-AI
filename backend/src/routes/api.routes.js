import { Router } from 'express';
import { auth, role } from '../middleware/auth.js';
import { asyncHandler as ah } from '../middleware/async.js';
import * as academic from '../controllers/academic.controller.js';
import * as campus from '../controllers/campus.controller.js';
import * as admin from '../controllers/admin.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

const router = Router();

router.get('/results', auth, role('student'), ah(academic.listResults));
router.get('/results/ai-analysis', auth, role('student'), ah(academic.aiResults));
router.post('/results/mid', auth, role('faculty'), ah(academic.saveMidMarks));

router.get('/attendance', auth, ah(academic.getAttendance));
router.post('/attendance', auth, role('faculty'), ah(academic.saveAttendance));
router.get('/attendance/ai-analysis', auth, role('student'), ah(academic.aiAttendance));

router.get('/timetable', auth, ah(campus.listTimetable));
router.get('/assignments', auth, ah(campus.listAssignments));
router.post('/assignments', auth, role('faculty'), ah(campus.createAssignment));
router.post('/assignments/:id/submit', auth, role('student'), upload.single('file'), ah(campus.submitAssignment));
router.get('/assignments/:id/submissions', auth, role('faculty', 'admin'), ah(campus.assignmentSubmissions));

router.get('/outpasses', auth, ah(campus.listOutpasses));
router.post('/outpasses', auth, role('student'), ah(campus.createOutpass));
router.patch('/outpasses/:id', auth, role('faculty'), ah(campus.reviewOutpass));
router.post('/outpasses/scan', auth, role('admin', 'faculty'), ah(campus.scanOutpass));

router.get('/certificates', auth, ah(campus.listCertificates));
router.post('/certificates', auth, role('student'), ah(campus.createCertificate));
router.patch('/certificates/:id', auth, role('admin'), ah(campus.reviewCertificate));

router.get('/notifications', auth, ah(campus.listNotifications));
router.post('/notifications', auth, role('faculty', 'admin'), ah(campus.createNotification));
router.patch('/notifications/read-all', auth, ah(campus.readAllNotifications));
router.patch('/notifications/:id/read', auth, ah(campus.readNotification));
router.delete('/notifications/:id', auth, role('admin'), ah(campus.deleteNotification));

router.get('/students/list', auth, role('faculty', 'admin'), ah(admin.listStudents));
router.get('/faculty/list', auth, ah(admin.facultyList));
router.patch('/profile', auth, ah(admin.updateProfile));
router.get('/search', auth, ah(admin.search));
router.get('/dashboard/overview', auth, ah(admin.overview));

router.get('/admin/students', auth, role('admin'), ah(admin.adminStudents));
router.post('/admin/students', auth, role('admin'), ah(admin.createStudent));
router.delete('/admin/students/:studentId', auth, role('admin'), ah(admin.deleteStudent));
router.get('/admin/faculty', auth, role('admin'), ah(admin.adminFaculty));
router.post('/admin/faculty', auth, role('admin'), ah(admin.createFaculty));
router.get('/admin/stats', auth, role('admin'), ah(admin.adminStats));
router.get('/admin/analytics', auth, role('admin'), ah(admin.adminAnalytics));
router.get('/admin/departments', auth, role('admin'), ah(admin.departments));

export default router;
