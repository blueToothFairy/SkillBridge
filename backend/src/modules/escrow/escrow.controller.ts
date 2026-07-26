import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import * as escrowService from './escrow.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function getEscrowStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const projectId = (req.query.projectId as string) || (req.params.projectId as string);
    if (!projectId) {
      return sendError(res, 'projectId is required', 400, 'VALIDATION_ERROR');
    }

    const status = await escrowService.getEscrowStatus(projectId, userId, role);
    return sendSuccess(res, status);
  } catch (error: any) {
    const msg = error.message || 'Failed to fetch escrow status';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function depositEscrow(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { projectId } = req.body;
    if (!projectId) {
      return sendError(res, 'projectId is required', 400, 'VALIDATION_ERROR');
    }

    const status = await escrowService.depositEscrow(projectId, userId, role === 'ADMIN');
    return sendSuccess(res, status);
  } catch (error: any) {
    const msg = error.message || 'Failed to deposit escrow';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    if (
      msg.includes('already') ||
      msg.includes('must be') ||
      msg.includes('Confirm matching') ||
      msg.includes('before')
    ) {
      return sendError(res, msg, 400, 'BAD_REQUEST');
    }
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function releaseEscrow(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { projectId } = req.body;
    if (!projectId) {
      return sendError(res, 'projectId is required', 400, 'VALIDATION_ERROR');
    }

    const status = await escrowService.releaseEscrow(projectId, userId, role === 'ADMIN');
    return sendSuccess(res, status);
  } catch (error: any) {
    const msg = error.message || 'Failed to release escrow';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    if (msg.includes('must be') || msg.includes('only be released')) {
      return sendError(res, msg, 400, 'BAD_REQUEST');
    }
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}
