"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("./project.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
// Public / Authenticated GET endpoints
router.get('/', project_controller_1.getProjects);
router.get('/pending', auth_1.authenticateJwt, (0, auth_1.requireRole)(['ADMIN']), project_controller_1.getPendingProjects);
router.get('/:id', project_controller_1.getProjectById);
// Protected SME endpoints
router.post('/', auth_1.authenticateJwt, (0, auth_1.requireRole)(['SME']), project_controller_1.createProject);
router.patch('/:id', auth_1.authenticateJwt, (0, auth_1.requireRole)(['SME']), project_controller_1.updateProject);
// Protected Admin endpoints
router.patch('/:id/review', auth_1.authenticateJwt, (0, auth_1.requireRole)(['ADMIN']), project_controller_1.reviewProject);
exports.default = router;
