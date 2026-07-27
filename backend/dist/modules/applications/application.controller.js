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
exports.applyToProject = applyToProject;
exports.getMyApplications = getMyApplications;
exports.getProjectApplicants = getProjectApplicants;
exports.updateApplicationStatus = updateApplicationStatus;
exports.confirmMatch = confirmMatch;
exports.withdrawApplication = withdrawApplication;
const applicationService = __importStar(require("./application.service"));
const response_1 = require("../../utils/response");
async function applyToProject(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { projectId, coverMessage } = req.body;
        if (!projectId || typeof projectId !== 'string') {
            return (0, response_1.sendError)(res, 'projectId is required', 400, 'VALIDATION_ERROR');
        }
        const application = await applicationService.applyToProject(userId, projectId, coverMessage);
        return (0, response_1.sendSuccess)(res, application, 201);
    }
    catch (error) {
        const msg = error.message || 'Failed to apply';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('already applied') || msg.includes('not open') || msg.includes('deadline') || msg.includes('limit')) {
            return (0, response_1.sendError)(res, msg, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function getMyApplications(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const applications = await applicationService.getMyApplications(userId);
        return (0, response_1.sendSuccess)(res, applications);
    }
    catch (error) {
        const msg = error.message || 'Failed to fetch applications';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function getProjectApplicants(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId || !role) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { projectId } = req.params;
        const applicants = await applicationService.getProjectApplicants(projectId, userId, role === 'ADMIN');
        return (0, response_1.sendSuccess)(res, applicants);
    }
    catch (error) {
        const msg = error.message || 'Failed to fetch applicants';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function updateApplicationStatus(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId || !role) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!['SHORTLISTED', 'ACCEPTED', 'REJECTED'].includes(status)) {
            return (0, response_1.sendError)(res, 'status must be SHORTLISTED, ACCEPTED, or REJECTED', 400, 'VALIDATION_ERROR');
        }
        const updated = await applicationService.updateApplicationStatus(id, userId, role === 'ADMIN', status);
        return (0, response_1.sendSuccess)(res, updated);
    }
    catch (error) {
        const msg = error.message || 'Failed to update application';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        if (msg.includes('Cannot'))
            return (0, response_1.sendError)(res, msg, 400, 'BAD_REQUEST');
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function confirmMatch(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId || !role) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { projectId, studentIds } = req.body;
        if (!projectId || !Array.isArray(studentIds) || studentIds.length === 0) {
            return (0, response_1.sendError)(res, 'projectId and studentIds[] are required', 400, 'VALIDATION_ERROR');
        }
        const result = await applicationService.confirmMatch(projectId, userId, role === 'ADMIN', studentIds);
        return (0, response_1.sendSuccess)(res, result);
    }
    catch (error) {
        const msg = error.message || 'Failed to confirm match';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        if (msg.includes('At least') ||
            msg.includes('Cannot') ||
            msg.includes('not open') ||
            msg.includes('have not applied')) {
            return (0, response_1.sendError)(res, msg, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function withdrawApplication(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        const updated = await applicationService.withdrawApplication(id, userId);
        return (0, response_1.sendSuccess)(res, updated);
    }
    catch (error) {
        const msg = error.message || 'Failed to withdraw application';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        if (msg.includes('Only'))
            return (0, response_1.sendError)(res, msg, 400, 'BAD_REQUEST');
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
