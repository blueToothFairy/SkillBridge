import { Router } from 'express';
import { getTags, createTag } from './tag.controller';
import { authenticateJwt, requireRole } from '../../middlewares/auth';

const router = Router();

router.get('/', getTags);
router.post('/', authenticateJwt, requireRole(['ADMIN']), createTag);

export default router;
