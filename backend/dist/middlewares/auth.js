"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = authenticateJwt;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
function authenticateJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, response_1.sendError)(res, 'Authorization token missing or invalid', 401, 'UNAUTHORIZED');
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        (0, response_1.sendError)(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
    }
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, response_1.sendError)(res, 'Access forbidden: Insufficient role permissions', 403, 'FORBIDDEN');
            return;
        }
        next();
    };
}
