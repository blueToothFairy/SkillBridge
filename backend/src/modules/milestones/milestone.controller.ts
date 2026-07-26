import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import * as milestoneService from './milestone.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function createMilestones(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { projectId, milestones } = req.body;
    if (!projectId || !Array.isArray(milestones) || milestones.length === 0) {
      return sendError(res, 'projectId and milestones[] are required', 400, 'VALIDATION_ERROR');
    }

    for (const m of milestones) {
      if (!m.title || !m.description || !m.deadline || m.amountVnd === undefined) {
        return sendError(
          res,
          'Each milestone requires title, description, deadline, amountVnd',
          400,
          'VALIDATION_ERROR'
        );
      }
    }

    const created = await milestoneService.createMilestones(
      projectId,
      userId,
      role === 'ADMIN',
      milestones
    );
    return sendSuccess(res, created, 201);
  } catch (error: any) {
    const msg = error.message || 'Failed to create milestones';
    if (msg.includes('not found')) return sendError(res, msg, 404, 'NOT_FOUND');
    if (msg.includes('Unauthorized')) return sendError(res, msg, 403, 'FORBIDDEN');
    if (msg.includes('only be added') || msg.includes('At least')) {
      return sendError(res, msg, 400, 'BAD_REQUEST');
    }
    return sendError(res, msg, 500, 'SERVER_ERROR');
  }
}

export async function getMilestones(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return sendError(res, 'projectId query parameter is required', 400, 'VALIDATION_ERROR');
    }

    const milestones = await milestoneService.getMilestones(projectId);
    return sendSuccess(res, milestones);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch milestones', 500, 'SERVER_ERROR');
  }
}

export async function submitDeliverable(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { deliverableUrl } = req.body;
    const studentUserId = req.user?.userId;

    if (!studentUserId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    if (!deliverableUrl || typeof deliverableUrl !== 'string') {
      return sendError(res, 'deliverableUrl is required and must be a string', 400, 'VALIDATION_ERROR');
    }

    // URL basic regex check
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlRegex.test(deliverableUrl)) {
      return sendError(res, 'deliverableUrl must be a valid URL format', 400, 'VALIDATION_ERROR');
    }

    const updatedMilestone = await milestoneService.submitDeliverable(id, studentUserId, deliverableUrl);
    return sendSuccess(res, updatedMilestone);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('not in progress')) {
      return sendError(res, error.message, 404, 'NOT_FOUND');
    }
    if (error.message.includes('Unauthorized') || error.message.includes('not matched')) {
      return sendError(res, error.message, 403, 'FORBIDDEN');
    }
    return sendError(res, error.message || 'Failed to submit milestone deliverable', 500, 'SERVER_ERROR');
  }
}

export async function cancelSubmission(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const studentUserId = req.user?.userId;

    if (!studentUserId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const updatedMilestone = await milestoneService.cancelSubmission(id, studentUserId);
    return sendSuccess(res, updatedMilestone);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('not in progress')) {
      return sendError(res, error.message, 404, 'NOT_FOUND');
    }
    if (error.message.includes('Unauthorized') || error.message.includes('not matched')) {
      return sendError(res, error.message, 403, 'FORBIDDEN');
    }
    return sendError(res, error.message || 'Failed to cancel milestone submission', 500, 'SERVER_ERROR');
  }
}

export async function reviewMilestone(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { action, feedback } = req.body;
    const reviewerUserId = req.user?.userId;
    const userRole = req.user?.role;

    if (!reviewerUserId || !userRole) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    if (action !== 'APPROVE' && action !== 'REVISE') {
      return sendError(res, 'Action must be APPROVE or REVISE', 400, 'VALIDATION_ERROR');
    }

    const isAdmin = userRole === 'ADMIN';
    const updatedMilestone = await milestoneService.reviewMilestone(
      id,
      reviewerUserId,
      isAdmin,
      action,
      feedback
    );

    return sendSuccess(res, updatedMilestone);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404, 'NOT_FOUND');
    }
    if (error.message.includes('Unauthorized') || error.message.includes('review')) {
      return sendError(res, error.message, 403, 'FORBIDDEN');
    }
    return sendError(res, error.message || 'Failed to review milestone', 500, 'SERVER_ERROR');
  }
}
