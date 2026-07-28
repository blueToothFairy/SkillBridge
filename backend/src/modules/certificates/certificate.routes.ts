import { Router } from 'express';
import { getCertificateByCode, getStudentCertificates, issueCertificate } from './certificate.controller';
import { authenticateJwt, requireRole } from '../../middlewares/auth';

const router = Router();

router.post('/', authenticateJwt, requireRole(['SME', 'ADMIN']), issueCertificate);
router.get('/student/:studentId', getStudentCertificates);
router.get('/verify/:code', getCertificateByCode);
router.get('/:code', getCertificateByCode);

export default router;
