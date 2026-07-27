import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  getPendingProjects,
  reviewProject,
  acceptProject,
  requestProjectRevision,
  triggerCron,
} from './project.controller';
import { authenticateJwt, requireRole } from '../../middlewares/auth';

const router = Router();

// Public / Authenticated GET endpoints
router.get('/', getProjects);
router.get('/pending', authenticateJwt, requireRole(['ADMIN']), getPendingProjects);
router.get('/:id', getProjectById);

// Public / Development endpoints
router.post('/test/trigger-cron', triggerCron);

// Protected SME endpoints
router.post('/', authenticateJwt, requireRole(['SME']), createProject);
router.patch('/:id', authenticateJwt, requireRole(['SME']), updateProject);
router.patch('/:id/accept', authenticateJwt, requireRole(['SME', 'ADMIN']), acceptProject);
router.patch('/:id/revision', authenticateJwt, requireRole(['SME', 'ADMIN']), requestProjectRevision);

// Protected Admin endpoints
router.patch('/:id/review', authenticateJwt, requireRole(['ADMIN']), reviewProject);

export default router;
