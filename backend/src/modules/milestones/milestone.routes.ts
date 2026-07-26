import { Router } from 'express';
import { getMilestones, submitDeliverable, reviewMilestone, cancelSubmission } from './milestone.controller';
import { authenticateJwt, requireRole } from '../../middlewares/auth';

const router = Router();

// Retrieve milestones for a project
router.get('/', authenticateJwt, getMilestones);

// Student nộp deliverable URL
router.patch('/:id/submit', authenticateJwt, requireRole(['STUDENT']), submitDeliverable);

// Student hủy nộp bài
router.patch('/:id/cancel', authenticateJwt, requireRole(['STUDENT']), cancelSubmission);

// SME Đánh giá & Duyệt mốc
router.patch('/:id/review', authenticateJwt, requireRole(['SME', 'ADMIN']), reviewMilestone);

export default router;
