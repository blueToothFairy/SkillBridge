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
exports.getEscrowStatus = getEscrowStatus;
exports.depositEscrow = depositEscrow;
exports.releaseEscrow = releaseEscrow;
const escrowService = __importStar(require("./escrow.service"));
const response_1 = require("../../utils/response");
async function getEscrowStatus(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId || !role) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const projectId = req.query.projectId || req.params.projectId;
        if (!projectId) {
            return (0, response_1.sendError)(res, 'projectId is required', 400, 'VALIDATION_ERROR');
        }
        const status = await escrowService.getEscrowStatus(projectId, userId, role);
        return (0, response_1.sendSuccess)(res, status);
    }
    catch (error) {
        const msg = error.message || 'Failed to fetch escrow status';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function depositEscrow(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId || !role) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { projectId } = req.body;
        if (!projectId) {
            return (0, response_1.sendError)(res, 'projectId is required', 400, 'VALIDATION_ERROR');
        }
        const status = await escrowService.depositEscrow(projectId, userId, role === 'ADMIN');
        return (0, response_1.sendSuccess)(res, status);
    }
    catch (error) {
        const msg = error.message || 'Failed to deposit escrow';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        if (msg.includes('already') ||
            msg.includes('must be') ||
            msg.includes('Confirm matching') ||
            msg.includes('before')) {
            return (0, response_1.sendError)(res, msg, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
async function releaseEscrow(req, res) {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId || !role) {
            return (0, response_1.sendError)(res, 'User identity unverified', 401, 'UNAUTHORIZED');
        }
        const { projectId } = req.body;
        if (!projectId) {
            return (0, response_1.sendError)(res, 'projectId is required', 400, 'VALIDATION_ERROR');
        }
        const status = await escrowService.releaseEscrow(projectId, userId, role === 'ADMIN');
        return (0, response_1.sendSuccess)(res, status);
    }
    catch (error) {
        const msg = error.message || 'Failed to release escrow';
        if (msg.includes('not found'))
            return (0, response_1.sendError)(res, msg, 404, 'NOT_FOUND');
        if (msg.includes('Unauthorized'))
            return (0, response_1.sendError)(res, msg, 403, 'FORBIDDEN');
        if (msg.includes('must be') || msg.includes('only be released')) {
            return (0, response_1.sendError)(res, msg, 400, 'BAD_REQUEST');
        }
        return (0, response_1.sendError)(res, msg, 500, 'SERVER_ERROR');
    }
}
