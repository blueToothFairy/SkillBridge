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
exports.createMilestones = createMilestones;
exports.getMilestones = getMilestones;
exports.submitDeliverable = submitDeliverable;
exports.cancelSubmission = cancelSubmission;
exports.reviewMilestone = reviewMilestone;
const milestoneService = __importStar(require("./milestone.service"));
const response_1 = require("../../utils/response");
async function createMilestones(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId || !role) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { projectId, milestones } = req.body;
        if (!projectId || !Array.isArray(milestones) || milestones.length === 0) {
            return (0, response_1.sendError)(res, 'projectId and milestones[] are required', 400, 'VALIDATION_ERROR');
        }
        for (const m of milestones) {
            if (!m.title || !m.description || !m.deadline || m.amountVnd === undefined) {
                return (0, response_1.sendError)(res, 'Each milestone requires title, description, deadline, amountVnd', 400, 'VALIDATION_ERROR');
            }
        }
        const created = await milestoneService.createMilestones(projectId, userId, role === 'ADMIN', milestones);
        return (0, response_1.sendSuccess)(res, created, 201);
    }
    catch (error) {
        const msg = error.message || 'Failed to create milestones';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        if (msg.includes('only be added') || msg.includes('At least')) {
            return (0, response_1.sendError)(res, msg, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function getMilestones(req, res) {
    try {
        const { projectId } = req.query;
        if (!projectId || typeof projectId !== 'string') {
            return (0, response_1.sendError)(res, 'projectId query parameter is required', 400, 'VALIDATION_ERROR');
        }
        const milestones = await milestoneService.getMilestones(projectId);
        return (0, response_1.sendSuccess)(res, milestones);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to fetch milestones', 500, 'SERVER_ERROR');
    }
}
async function submitDeliverable(req, res) {
    try {
        const { id } = req.params;
        const { deliverableUrl } = req.body;
        const studentUserId = req.user?.userId;
        if (!studentUserId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        if (!deliverableUrl || typeof deliverableUrl !== 'string') {
            return (0, response_1.sendError)(res, 'deliverableUrl is required and must be a string', 400, 'VALIDATION_ERROR');
        }
        // URL basic regex check
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlRegex.test(deliverableUrl)) {
            return (0, response_1.sendError)(res, 'deliverableUrl must be a valid URL format', 400, 'VALIDATION_ERROR');
        }
        const updatedMilestone = await milestoneService.submitDeliverable(id, studentUserId, deliverableUrl);
        return (0, response_1.sendSuccess)(res, updatedMilestone);
    }
    catch (error) {
        if (error.message.includes('not found') || error.message.includes('not in progress')) {
            return (0, response_1.sendError)(res, error.message, 404, 'NOT_FOUND');
        }
        if (error.message.includes('Unauthorized') || error.message.includes('not matched')) {
            return (0, response_1.sendError)(res, error.message, 403, 'FORBIDDEN');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to submit milestone deliverable', 500, 'SERVER_ERROR');
    }
}
async function cancelSubmission(req, res) {
    try {
        const { id } = req.params;
        const studentUserId = req.user?.userId;
        if (!studentUserId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const updatedMilestone = await milestoneService.cancelSubmission(id, studentUserId);
        return (0, response_1.sendSuccess)(res, updatedMilestone);
    }
    catch (error) {
        if (error.message.includes('not found') || error.message.includes('not in progress')) {
            return (0, response_1.sendError)(res, error.message, 404, 'NOT_FOUND');
        }
        if (error.message.includes('Unauthorized') || error.message.includes('not matched')) {
            return (0, response_1.sendError)(res, error.message, 403, 'FORBIDDEN');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to cancel milestone submission', 500, 'SERVER_ERROR');
    }
}
async function reviewMilestone(req, res) {
    try {
        const { id } = req.params;
        const { action, feedback } = req.body;
        const reviewerUserId = req.user?.userId;
        const userRole = req.user?.role;
        if (!reviewerUserId || !userRole) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        if (action !== 'APPROVE' && action !== 'REVISE') {
            return (0, response_1.sendError)(res, 'Action must be APPROVE or REVISE', 400, 'VALIDATION_ERROR');
        }
        const isAdmin = userRole === 'ADMIN';
        const updatedMilestone = await milestoneService.reviewMilestone(id, reviewerUserId, isAdmin, action, feedback);
        return (0, response_1.sendSuccess)(res, updatedMilestone);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return (0, response_1.sendError)(res, error.message, 404, 'NOT_FOUND');
        }
        if (error.message.includes('Unauthorized') || error.message.includes('review')) {
            return (0, response_1.sendError)(res, error.message, 403, 'FORBIDDEN');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to review milestone', 500, 'SERVER_ERROR');
    }
}
