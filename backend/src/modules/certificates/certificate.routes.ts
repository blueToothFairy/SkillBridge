import { Router } from 'express';
import { getCertificateByCode } from './certificate.controller';

const router = Router();

// Public verification endpoint
router.get('/:code', getCertificateByCode);

export default router;
