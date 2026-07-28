import { Router } from 'express';
import { getStudentPortfolio } from './portfolio.controller';

const router = Router();

// Retrieve unified profile and verified portfolio entries for a student
router.get('/student/:id', getStudentPortfolio);

export default router;
