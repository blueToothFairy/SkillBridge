"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const milestone_controller_1 = require("./milestone.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
// Create milestones for a project (also created inline via POST /api/projects)
router.post('/', auth_1.authenticateJwt, (0, auth_1.requireRole)(['SME', 'ADMIN']), milestone_controller_1.createMilestones);
// Retrieve milestones for a project
router.get('/', auth_1.authenticateJwt, milestone_controller_1.getMilestones);
// Student nộp deliverable URL
router.patch('/:id/submit', auth_1.authenticateJwt, (0, auth_1.requireRole)(['STUDENT']), milestone_controller_1.submitDeliverable);
// Student hủy nộp bài
router.patch('/:id/cancel', auth_1.authenticateJwt, (0, auth_1.requireRole)(['STUDENT']), milestone_controller_1.cancelSubmission);
// SME Đánh giá & Duyệt mốc
router.patch('/:id/review', auth_1.authenticateJwt, (0, auth_1.requireRole)(['SME', 'ADMIN']), milestone_controller_1.reviewMilestone);
exports.default = router;
