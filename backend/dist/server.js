"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const server = app_1.default.listen(env_1.config.port, () => {
    logger_1.logger.info(`Server is running on port ${env_1.config.port} [${env_1.config.nodeEnv}]`);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
});
