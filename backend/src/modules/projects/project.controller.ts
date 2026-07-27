import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { ProjectStatus } from '@prisma/client';
import * as projectService from './project.service';
import { sendSuccess, sendError } from '../../utils/response';
import { prisma } from '../../config/prisma';
import { runAcceptanceRemindersJob } from '../../utils/scheduler';

export async function createProject(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { title, description, categoryTagId, requiredSkillTags, budget, durationWeeks, maxApplicants, deadline, milestones } = req.body;

    if (!title || !description || !categoryTagId || !budget || !durationWeeks) {
      return sendError(res, 'Required fields: title, description, categoryTagId, budget, durationWeeks', 400, 'VALIDATION_ERROR');
    }

    const projectDeadline = deadline ? new Date(deadline) : new Date(Date.now() + Number(durationWeeks) * 7 * 24 * 60 * 60 * 1000);

    if (!milestones || !Array.isArray(milestones)) {
      return sendError(res, 'Milestones are required when creating a project', 400, 'VALIDATION_ERROR');
    }

    if (milestones.length < 1 || milestones.length > 10) {
      return sendError(res, 'Project must have between 1 and 10 milestones', 400, 'VALIDATION_ERROR');
    }

    let milestoneBudgetSum = 0;
    for (const m of milestones) {
      if (!m.title || !m.description || !m.deadline || m.amountVnd === undefined) {
        return sendError(res, 'Milestones must include: title, description, deadline, amountVnd', 400, 'VALIDATION_ERROR');
      }
      if (m.title.length < 3 || m.title.length > 200) {
        return sendError(res, 'Milestone title must be 3-200 characters', 400, 'VALIDATION_ERROR');
      }
      if (m.description.length < 10 || m.description.length > 2000) {
        return sendError(res, 'Milestone description must be 10-2000 characters', 400, 'VALIDATION_ERROR');
      }

      const msDeadline = new Date(m.deadline);
      if (msDeadline.getTime() > projectDeadline.getTime()) {
        return sendError(
          res,
          `Hạn chót của cột mốc "${m.title}" (${msDeadline.toLocaleDateString('vi-VN')}) không được vượt quá hạn chót của dự án (${projectDeadline.toLocaleDateString('vi-VN')} - dựa trên thời hạn ${durationWeeks} tuần).`,
          400,
          'VALIDATION_ERROR'
        );
      }
      milestoneBudgetSum += Number(m.amountVnd);
    }

    if (milestoneBudgetSum !== Number(budget)) {
      return sendError(res, `Sum of milestone budgets (${milestoneBudgetSum}) must equal total project budget (${budget})`, 400, 'VALIDATION_ERROR');
    }

    const newProject = await projectService.createProject(userId, {
      title,
      description,
      categoryTagId,
      requiredSkillTags: Array.isArray(requiredSkillTags) ? requiredSkillTags : [],
      budget: Number(budget),
      durationWeeks: Number(durationWeeks),
      maxApplicants: maxApplicants ? Number(maxApplicants) : undefined,
      deadline: projectDeadline,
      milestones,
    });

    return sendSuccess(res, newProject, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create project', 500, 'SERVER_ERROR');
  }
}

export async function getProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const { categoryTagId, query, status, page, limit, mine, smeId } = req.query;

    let smeUserId: string | undefined;
    if (mine === 'true') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return sendError(res, 'Authorization required for mine=true', 401, 'UNAUTHORIZED');
      }
      // Prefer JWT already parsed when middleware used; fallback decode via optional user
      if (!req.user?.userId) {
        // Lazy auth for public route: verify manually
        try {
          const { verifyToken } = await import('../../utils/jwt');
          const payload = verifyToken(authHeader.split(' ')[1]);
          req.user = payload;
        } catch {
          return sendError(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
        }
      }
      if (req.user?.role !== 'SME' && req.user?.role !== 'ADMIN') {
        return sendError(res, 'Only SME/Admin can list own projects', 403, 'FORBIDDEN');
      }
      smeUserId = req.user.role === 'SME' ? req.user.userId : undefined;
    }

    const result = await projectService.getProjects({
      categoryTagId: categoryTagId as string | undefined,
      query: query as string | undefined,
      status: status as ProjectStatus | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      smeUserId,
      smeId: smeId as string | undefined,
    });

    return sendSuccess(res, result.projects, 200, result.meta);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch projects', 500, 'SERVER_ERROR');
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);

    if (!project) {
      return sendError(res, 'Project not found', 404, 'NOT_FOUND');
    }

    const { _count, ...rest } = project as any;
    const result = {
      ...rest,
      applicantCount: _count?.applications || 0,
    };

    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch project detail', 500, 'SERVER_ERROR');
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const updatedProject = await projectService.updateProject(id, userId, req.body);

    return sendSuccess(res, updatedProject);
  } catch (error: any) {
    if (error.message === 'Project not found') {
      return sendError(res, error.message, 404, 'NOT_FOUND');
    }
    if (error.message === 'Unauthorized to edit this project') {
      return sendError(res, error.message, 403, 'FORBIDDEN');
    }
    return sendError(res, error.message || 'Failed to update project', 500, 'SERVER_ERROR');
  }
}

export async function getPendingProjects(_req: AuthenticatedRequest, res: Response) {
  try {
    const projects = await projectService.getPendingProjects();
    return sendSuccess(res, projects);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch pending projects', 500, 'SERVER_ERROR');
  }
}

export async function reviewProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return sendError(res, 'Action must be APPROVE or REJECT', 400, 'VALIDATION_ERROR');
    }

    const updatedProject = await projectService.reviewProject(id, action);
    return sendSuccess(res, updatedProject);
  } catch (error: any) {
    if (error.message === 'Project not found') {
      return sendError(res, error.message, 404, 'NOT_FOUND');
    }
    if (error.message === 'Project is not under review') {
      return sendError(res, error.message, 400, 'BAD_REQUEST');
    }
    return sendError(res, error.message || 'Failed to review project', 500, 'SERVER_ERROR');
  }
}

export async function acceptProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const updatedProject = await projectService.acceptProject(id, userId, role === 'ADMIN');
    return sendSuccess(res, updatedProject);
  } catch (error: any) {
    if (error.message === 'Project not found') {
      return sendError(res, error.message, 404, 'NOT_FOUND');
    }
    if (error.message === 'Unauthorized to accept this project') {
      return sendError(res, error.message, 403, 'FORBIDDEN');
    }
    if (error.message === 'Project is not in pending acceptance status') {
      return sendError(res, error.message, 400, 'BAD_REQUEST');
    }
    return sendError(res, error.message || 'Failed to accept project', 500, 'SERVER_ERROR');
  }
}

export async function requestProjectRevision(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    if (!feedback || feedback.trim().length < 10) {
      return sendError(res, 'Feedback must be at least 10 characters long', 400, 'VALIDATION_ERROR');
    }

    const updatedProject = await projectService.requestProjectRevision(id, userId, role === 'ADMIN', feedback);
    return sendSuccess(res, updatedProject);
  } catch (error: any) {
    if (error.message === 'Project not found') {
      return sendError(res, error.message, 404, 'NOT_FOUND');
    }
    if (error.message === 'Unauthorized to request revision for this project') {
      return sendError(res, error.message, 403, 'FORBIDDEN');
    }
    if (error.message === 'Project is not in pending acceptance status') {
      return sendError(res, error.message, 400, 'BAD_REQUEST');
    }
    return sendError(res, error.message || 'Failed to request project revision', 500, 'SERVER_ERROR');
  }
}

export async function triggerCron(req: Request, res: Response) {
  try {
    const { projectId, days = 28 } = req.body;
    const shiftMs = Number(days) * 24 * 60 * 60 * 1000;

    const whereClause: any = { triggeredAt: null };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    const reminders = await prisma.acceptanceReminder.findMany({
      where: whereClause,
    });

    for (const r of reminders) {
      await prisma.acceptanceReminder.update({
        where: { id: r.id },
        data: {
          scheduledAt: new Date(r.scheduledAt.getTime() - shiftMs),
        },
      });
    }

    // Run scheduler job immediately
    const summary = await runAcceptanceRemindersJob();

    return sendSuccess(res, {
      message: `Successfully shifted ${reminders.length} reminders back by ${days} days and executed scheduler check.`,
      remindersShiftedCount: reminders.length,
      schedulerSummary: summary,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to trigger scheduler simulation', 500, 'SERVER_ERROR');
  }
}
