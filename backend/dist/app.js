"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_2 = require("./config/cors");
const health_routes_1 = __importDefault(require("./modules/health/health.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const tag_routes_1 = __importDefault(require("./modules/tags/tag.routes"));
const project_routes_1 = __importDefault(require("./modules/projects/project.routes"));
const milestone_routes_1 = __importDefault(require("./modules/milestones/milestone.routes"));
const application_routes_1 = __importDefault(require("./modules/applications/application.routes"));
const escrow_routes_1 = __importDefault(require("./modules/escrow/escrow.routes"));
const certificate_routes_1 = __importDefault(require("./modules/certificates/certificate.routes"));
const response_1 = require("./utils/response");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/health', health_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tags', tag_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/milestones', milestone_routes_1.default);
app.use('/api/applications', application_routes_1.default);
app.use('/api/escrow', escrow_routes_1.default);
app.use('/api/certificates', certificate_routes_1.default);
// Fallback 404 Route
app.use((_req, res) => {
    (0, response_1.sendError)(res, 'Route not found', 404, 'NOT_FOUND');
});
exports.default = app;
