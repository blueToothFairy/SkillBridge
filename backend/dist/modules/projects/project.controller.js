"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.getPendingProjects = getPendingProjects;
exports.reviewProject = reviewProject;
exports.acceptProject = acceptProject;
exports.requestProjectRevision = requestProjectRevision;
exports.triggerCron = triggerCron;
const projectService = __importStar(require("./project.service"));
const response_1 = require("../../utils/response");
const prisma_1 = require("../../config/prisma");
const scheduler_1 = require("../../utils/scheduler");
async function createProject(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { title, description, categoryTagId, requiredSkillTags, budget, durationWeeks, maxApplicants, deadline, milestones } = req.body;
        if (!title || !description || !categoryTagId || !budget || !durationWeeks) {
            return (0, response_1.sendError)(res, 'Required fields: title, description, categoryTagId, budget, durationWeeks', 400, 'VALIDATION_ERROR');
        }
        const projectDeadline = deadline ? new Date(deadline) : new Date(Date.now() + Number(durationWeeks) * 7 * 24 * 60 * 60 * 1000);
        if (!milestones || !Array.isArray(milestones)) {
            return (0, response_1.sendError)(res, 'Milestones are required when creating a project', 400, 'VALIDATION_ERROR');
        }
        if (milestones.length < 1 || milestones.length > 10) {
            return (0, response_1.sendError)(res, 'Project must have between 1 and 10 milestones', 400, 'VALIDATION_ERROR');
        }
        let milestoneBudgetSum = 0;
        for (const m of milestones) {
            if (!m.title || !m.description || !m.deadline || m.amountVnd === undefined) {
                return (0, response_1.sendError)(res, 'Milestones must include: title, description, deadline, amountVnd', 400, 'VALIDATION_ERROR');
            }
            if (m.title.length < 3 || m.title.length > 200) {
                return (0, response_1.sendError)(res, 'Milestone title must be 3-200 characters', 400, 'VALIDATION_ERROR');
            }
            if (m.description.length < 10 || m.description.length > 2000) {
                return (0, response_1.sendError)(res, 'Milestone description must be 10-2000 characters', 400, 'VALIDATION_ERROR');
            }
            const msDeadline = new Date(m.deadline);
            if (msDeadline.getTime() > projectDeadline.getTime()) {
                return (0, response_1.sendError)(res, `Hạn chót của cột mốc "${m.title}" (${msDeadline.toLocaleDateString('vi-VN')}) không được vượt quá hạn chót của dự án (${projectDeadline.toLocaleDateString('vi-VN')} - dựa trên thời hạn ${durationWeeks} tuần).`, 400, 'VALIDATION_ERROR');
            }
            milestoneBudgetSum += Number(m.amountVnd);
        }
        if (milestoneBudgetSum !== Number(budget)) {
            return (0, response_1.sendError)(res, `Sum of milestone budgets (${milestoneBudgetSum}) must equal total project budget (${budget})`, 400, 'VALIDATION_ERROR');
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
        return (0, response_1.sendSuccess)(res, newProject, 201);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to create project', 500, 'SERVER_ERROR');
    }
}
async function getProjects(req, res) {
    try {
        const { categoryTagId, query, status, page, limit, mine, smeId } = req.query;
        let smeUserId;
        if (mine === 'true') {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return (0, response_1.sendError)(res, 'Authorization required for mine=true', 401, 'UNAUTHORIZED');
            }
            // Prefer JWT already parsed when middleware used; fallback decode via optional user
            if (!req.user?.userId) {
                // Lazy auth for public route: verify manually
                try {
                    const { verifyToken } = await Promise.resolve().then(() => __importStar(require('../../utils/jwt')));
                    const payload = verifyToken(authHeader.split(' ')[1]);
                    req.user = payload;
                }
                catch {
                    return (0, response_1.sendError)(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
                }
            }
            if (req.user?.role !== 'SME' && req.user?.role !== 'ADMIN') {
                return (0, response_1.sendError)(res, 'Only SME/Admin can list own projects', 403, 'FORBIDDEN');
            }
            smeUserId = req.user.role === 'SME' ? req.user.userId : undefined;
        }
        const result = await projectService.getProjects({
            categoryTagId: categoryTagId,
            query: query,
            status: status,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            smeUserId,
            smeId: smeId,
        });
        return (0, response_1.sendSuccess)(res, result.projects, 200, result.meta);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to fetch projects', 500, 'SERVER_ERROR');
    }
}
async function getProjectById(req, res) {
    try {
        const { id } = req.params;
        const project = await projectService.getProjectById(id);
        if (!project) {
            return (0, response_1.sendError)(res, 'Project not found', 404, 'NOT_FOUND');
        }
        const { _count, ...rest } = project;
        const result = {
            ...rest,
            applicantCount: _count?.applications || 0,
        };
        return (0, response_1.sendSuccess)(res, result);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to fetch project detail', 500, 'SERVER_ERROR');
    }
}
async function updateProject(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        const updatedProject = await projectService.updateProject(id, userId, req.body);
        return (0, response_1.sendSuccess)(res, updatedProject);
    }
    catch (error) {
        if (error.message === 'Project not found') {
            return (0, response_1.sendError)(res, error.message, 404, 'NOT_FOUND');
        }
        if (error.message === 'Unauthorized to edit this project') {
            return (0, response_1.sendError)(res, error.message, 403, 'FORBIDDEN');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to update project', 500, 'SERVER_ERROR');
    }
}
async function getPendingProjects(_req, res) {
    try {
        const projects = await projectService.getPendingProjects();
        return (0, response_1.sendSuccess)(res, projects);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to fetch pending projects', 500, 'SERVER_ERROR');
    }
}
async function reviewProject(req, res) {
    try {
        const { id } = req.params;
        const { action } = req.body;
        if (action !== 'APPROVE' && action !== 'REJECT') {
            return (0, response_1.sendError)(res, 'Action must be APPROVE or REJECT', 400, 'VALIDATION_ERROR');
        }
        const updatedProject = await projectService.reviewProject(id, action);
        return (0, response_1.sendSuccess)(res, updatedProject);
    }
    catch (error) {
        if (error.message === 'Project not found') {
            return (0, response_1.sendError)(res, error.message, 404, 'NOT_FOUND');
        }
        if (error.message === 'Project is not under review') {
            return (0, response_1.sendError)(res, error.message, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to review project', 500, 'SERVER_ERROR');
    }
}
async function acceptProject(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const updatedProject = await projectService.acceptProject(id, userId, role === 'ADMIN');
        return (0, response_1.sendSuccess)(res, updatedProject);
    }
    catch (error) {
        if (error.message === 'Project not found') {
            return (0, response_1.sendError)(res, error.message, 404, 'NOT_FOUND');
        }
        if (error.message === 'Unauthorized to accept this project') {
            return (0, response_1.sendError)(res, error.message, 403, 'FORBIDDEN');
        }
        if (error.message === 'Project is not in pending acceptance status') {
            return (0, response_1.sendError)(res, error.message, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to accept project', 500, 'SERVER_ERROR');
    }
}
async function requestProjectRevision(req, res) {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        if (!feedback || feedback.trim().length < 10) {
            return (0, response_1.sendError)(res, 'Feedback must be at least 10 characters long', 400, 'VALIDATION_ERROR');
        }
        const updatedProject = await projectService.requestProjectRevision(id, userId, role === 'ADMIN', feedback);
        return (0, response_1.sendSuccess)(res, updatedProject);
    }
    catch (error) {
        if (error.message === 'Project not found') {
            return (0, response_1.sendError)(res, error.message, 404, 'NOT_FOUND');
        }
        if (error.message === 'Unauthorized to request revision for this project') {
            return (0, response_1.sendError)(res, error.message, 403, 'FORBIDDEN');
        }
        if (error.message === 'Project is not in pending acceptance status') {
            return (0, response_1.sendError)(res, error.message, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to request project revision', 500, 'SERVER_ERROR');
    }
}
async function triggerCron(req, res) {
    try {
        const { projectId, days = 28 } = req.body;
        const shiftMs = Number(days) * 24 * 60 * 60 * 1000;
        const whereClause = { triggeredAt: null };
        if (projectId) {
            whereClause.projectId = projectId;
        }
        const reminders = await prisma_1.prisma.acceptanceReminder.findMany({
            where: whereClause,
        });
        for (const r of reminders) {
            await prisma_1.prisma.acceptanceReminder.update({
                where: { id: r.id },
                data: {
                    scheduledAt: new Date(r.scheduledAt.getTime() - shiftMs),
                },
            });
        }
        // Run scheduler job immediately
        const summary = await (0, scheduler_1.runAcceptanceRemindersJob)();
        return (0, response_1.sendSuccess)(res, {
            message: `Successfully shifted ${reminders.length} reminders back by ${days} days and executed scheduler check.`,
            remindersShiftedCount: reminders.length,
            schedulerSummary: summary,
        });
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to trigger scheduler simulation', 500, 'SERVER_ERROR');
    }
}
