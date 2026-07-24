"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, statusCode = 200, meta) {
    const responseBody = {
        success: true,
        data,
        ...(meta ? { meta } : {}),
    };
    return res.status(statusCode).json(responseBody);
}
function sendError(res, message, statusCode = 400, code = 'BAD_REQUEST', details) {
    const responseBody = {
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    };
    return res.status(statusCode).json(responseBody);
}
