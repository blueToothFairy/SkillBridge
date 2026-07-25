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
const projectService = __importStar(require("./project.service"));
const response_1 = require("../../utils/response");
async function createProject(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { title, description, categoryTagId, requiredSkillTags, budget, durationWeeks, maxApplicants, deadline } = req.body;
        if (!title || !description || !categoryTagId || !budget || !durationWeeks) {
            return (0, response_1.sendError)(res, 'Required fields: title, description, categoryTagId, budget, durationWeeks', 400, 'VALIDATION_ERROR');
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
        return (0, response_1.sendSuccess)(res, newProject, 201);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to create project', 500, 'SERVER_ERROR');
    }
}
async function getProjects(req, res) {
    try {
        const { categoryTagId, query, status, page, limit } = req.query;
        const result = await projectService.getProjects({
            categoryTagId: categoryTagId,
            query: query,
            status: status,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
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
        return (0, response_1.sendSuccess)(res, project);
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
