import { Request, Response } from 'express';
import * as portfolioService from './portfolio.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function getStudentPortfolio(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'Student ID is required', 400, 'VALIDATION_ERROR');
    }

    const data = await portfolioService.getStudentProfileAndPortfolio(id);

    if (!data) {
      return sendError(res, 'Student profile not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch student portfolio', 500, 'SERVER_ERROR');
  }
}
