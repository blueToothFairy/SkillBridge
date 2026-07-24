"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_2 = require("./config/cors");
const health_routes_1 = __importDefault(require("./modules/health/health.routes"));
const response_1 = require("./utils/response");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/health', health_routes_1.default);
// Fallback 404 Route
app.use((_req, res) => {
    (0, response_1.sendError)(res, 'Route not found', 404, 'NOT_FOUND');
});
exports.default = app;
