import { Router } from 'express';
import { getCertificateByCode, getStudentCertificates } from './certificate.controller';

const router = Router();

// Retrieve certificates by student profile ID
router.get('/student/:studentId', getStudentCertificates);

// Public verification endpoint
router.get('/:code', getCertificateByCode);

export default router;
