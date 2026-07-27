"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const scheduler_1 = require("./utils/scheduler");
const server = app_1.default.listen(env_1.config.port, () => {
    logger_1.logger.info(`Server is running on port ${env_1.config.port} [${env_1.config.nodeEnv}]`);
    // Set up the background scheduler for project acceptance reminders
    // Period: 2 minutes in development, 1 hour in production
    const schedulerIntervalMs = env_1.config.nodeEnv === 'production' ? 60 * 60 * 1000 : 2 * 60 * 1000;
    logger_1.logger.info(`Initializing acceptance reminders scheduler (interval: ${schedulerIntervalMs / 1000}s)`);
    const intervalId = setInterval(async () => {
        try {
            const summary = await (0, scheduler_1.runAcceptanceRemindersJob)();
            if (summary.remindersTriggered > 0) {
                logger_1.logger.info(`[Scheduler Run] Checked ${summary.remindersChecked} reminders, triggered ${summary.remindersTriggered}.`);
            }
        }
        catch (err) {
            logger_1.logger.error(`[Scheduler Error] failed execution: ${err.message}`);
        }
    }, schedulerIntervalMs);
    // Store on server object or context if needed to clean up during SIGTERM
    server._schedulerIntervalId = intervalId;
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    if (server._schedulerIntervalId) {
        clearInterval(server._schedulerIntervalId);
        logger_1.logger.info('Background scheduler cleared');
    }
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
});
