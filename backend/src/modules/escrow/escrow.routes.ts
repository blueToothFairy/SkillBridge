import { Router } from 'express';
import { depositEscrow, releaseEscrow, getEscrowStatus } from './escrow.controller';
import { authenticateJwt, requireRole } from '../../middlewares/auth';

const router = Router();

router.get('/status', authenticateJwt, getEscrowStatus);
router.post('/deposit', authenticateJwt, requireRole(['SME', 'ADMIN']), depositEscrow);
router.post('/release', authenticateJwt, requireRole(['SME', 'ADMIN']), releaseEscrow);

export default router;
