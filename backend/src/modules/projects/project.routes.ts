import { Router } from 'express';
import { createProject, getProjects, getProjectById, updateProject, getPendingProjects, reviewProject } from './project.controller';
import { authenticateJwt, requireRole } from '../../middlewares/auth';

const router = Router();

// Public / Authenticated GET endpoints
router.get('/', getProjects);
router.get('/pending', authenticateJwt, requireRole(['ADMIN']), getPendingProjects);
router.get('/:id', getProjectById);

// Protected SME endpoints
router.post('/', authenticateJwt, requireRole(['SME']), createProject);
router.patch('/:id', authenticateJwt, requireRole(['SME']), updateProject);

// Protected Admin endpoints
router.patch('/:id/review', authenticateJwt, requireRole(['ADMIN']), reviewProject);

export default router;
