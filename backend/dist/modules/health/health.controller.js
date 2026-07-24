"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const response_1 = require("../../utils/response");
class HealthController {
    static getHealth(_req, res) {
        const healthStatus = {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            service: 'SkillBridge API',
        };
        (0, response_1.sendSuccess)(res, healthStatus);
    }
}
exports.HealthController = HealthController;
