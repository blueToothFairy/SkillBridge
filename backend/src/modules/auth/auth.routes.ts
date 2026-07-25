import { Router } from 'express';
import { register, login, getMe, updateProfile } from './auth.controller';
import { authenticateJwt } from '../../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJwt, getMe);
router.patch('/profile', authenticateJwt, updateProfile);

export default router;
