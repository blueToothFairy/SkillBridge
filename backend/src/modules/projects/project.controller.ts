import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { ProjectStatus } from '@prisma/client';
import * as projectService from './project.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function createProject(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }

    const { title, description, categoryTagId, requiredSkillTags, budget, durationWeeks, maxApplicants, deadline } = req.body;

    if (!title || !description || !categoryTagId || !budget || !durationWeeks) {
      return sendError(res, 'Required fields: title, description, categoryTagId, budget, durationWeeks', 400, 'VALIDATION_ERROR');
    }

    const newProject = await projectService.createProject(userId, {
      title,
      description,
      categoryTagId,
      requiredSkillTags: Array.isArray(requiredSkillTags) ? requiredSkillTags : [],
      budget: Number(budget),
      durationWeeks: Number(durationWeeks),
      maxApplicants: maxApplicants ? Number(maxApplicants) : undefined,
      deadline,
    });

    return sendSuccess(res, newProject, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create project', 500, 'SERVER_ERROR');
  }
}

export async function getProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const { categoryTagId, query, status, page, limit } = req.query;

    const result = await projectService.getProjects({
      categoryTagId: categoryTagId as string | undefined,
      query: query as string | undefined,
      status: status as ProjectStatus | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
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

    return sendSuccess(res, project);
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
