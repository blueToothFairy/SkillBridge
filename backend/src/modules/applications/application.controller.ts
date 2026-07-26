import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import * as applicationService from './application.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function applyToProject(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { projectId, coverMessage } = req.body;
    if (!projectId || typeof projectId !== 'string') {
      return sendError(res, 'projectId is required', 400, 'VALIDATION_ERROR');
    }

    const application = await applicationService.applyToProject(userId, projectId, coverMessage);
    return sendSuccess(res, application, 201);
  } catch (error: any) {
    const msg = error.message || 'Failed to apply';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('already applied') || msg.includes('not open') || msg.includes('deadline') || msg.includes('limit')) {
      return sendError(res, msg, 400, 'BAD_REQUEST');
    }
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function getMyApplications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const applications = await applicationService.getMyApplications(userId);
    return sendSuccess(res, applications);
  } catch (error: any) {
    const msg = error.message || 'Failed to fetch applications';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function getProjectApplicants(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { projectId } = req.params;
    const applicants = await applicationService.getProjectApplicants(
      projectId,
      userId,
      role === 'ADMIN'
    );
    return sendSuccess(res, applicants);
  } catch (error: any) {
    const msg = error.message || 'Failed to fetch applicants';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function updateApplicationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['SHORTLISTED', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return sendError(res, 'status must be SHORTLISTED, ACCEPTED, or REJECTED', 400, 'VALIDATION_ERROR');
    }

    const updated = await applicationService.updateApplicationStatus(
      id,
      userId,
      role === 'ADMIN',
      status
    );
    return sendSuccess(res, updated);
  } catch (error: any) {
    const msg = error.message || 'Failed to update application';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    if (msg.includes('Cannot')) return sendError(res, msg, 400, 'BAD_REQUEST');
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function confirmMatch(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { projectId, studentIds } = req.body;
    if (!projectId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return sendError(res, 'projectId and studentIds[] are required', 400, 'VALIDATION_ERROR');
    }

    const result = await applicationService.confirmMatch(
      projectId,
      userId,
      role === 'ADMIN',
      studentIds
    );
    return sendSuccess(res, result);
  } catch (error: any) {
    const msg = error.message || 'Failed to confirm match';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    if (
      msg.includes('At least') ||
      msg.includes('Cannot') ||
      msg.includes('not open') ||
      msg.includes('have not applied')
    ) {
      return sendError(res, msg, 400, 'BAD_REQUEST');
    }
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function withdrawApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const updated = await applicationService.withdrawApplication(id, userId);
    return sendSuccess(res, updated);
  } catch (error: any) {
    const msg = error.message || 'Failed to withdraw application';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    if (msg.includes('Only')) return sendError(res, msg, 400, 'BAD_REQUEST');
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}
