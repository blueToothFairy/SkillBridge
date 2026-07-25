import { Router } from 'express';
import { getTags, createTag } from './tag.controller';

const router = Router();

router.get('/', getTags);
router.post('/', createTag);

export default router;
