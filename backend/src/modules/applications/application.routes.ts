import { Router } from 'express';
import {
  applyToProject,
  getMyApplications,
  getProjectApplicants,
  updateApplicationStatus,
  confirmMatch,
  withdrawApplication,
} from './application.controller';
import { authenticateJwt, requireRole } from '../../middlewares/auth';

const router = Router();

router.post('/', authenticateJwt, requireRole(['STUDENT']), applyToProject);
router.get('/me', authenticateJwt, requireRole(['STUDENT']), getMyApplications);
router.post('/confirm-match', authenticateJwt, requireRole(['SME', 'ADMIN']), confirmMatch);
router.get(
  '/project/:projectId',
  authenticateJwt,
  requireRole(['SME', 'ADMIN']),
  getProjectApplicants
);
router.patch('/:id/status', authenticateJwt, requireRole(['SME', 'ADMIN']), updateApplicationStatus);
router.delete('/:id', authenticateJwt, requireRole(['STUDENT']), withdrawApplication);

export default router;
