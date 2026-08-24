import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { asyncHandler as ah } from '../middleware/async.js';
import * as authCtl from '../controllers/auth.controller.js';

const router = Router();
router.post('/login', ah(authCtl.login));
router.post('/forgot-password', ah(authCtl.forgotPassword));
router.post('/reset-password', ah(authCtl.resetPassword));
router.get('/me', auth, ah(authCtl.me));
router.post('/change-password', auth, ah(authCtl.changePassword));
export default router;
