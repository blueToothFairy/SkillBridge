"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMilestones = getMilestones;
exports.createMilestones = createMilestones;
exports.submitDeliverable = submitDeliverable;
exports.cancelSubmission = cancelSubmission;
exports.reviewMilestone = reviewMilestone;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
async function getMilestones(projectId) {
    return await prisma_1.prisma.milestone.findMany({
        where: { projectId },
        orderBy: { orderIndex: 'asc' },
    });
}
async function createMilestones(projectId, requesterUserId, isAdmin, milestones) {
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            sme: true,
            milestones: { orderBy: { orderIndex: 'asc' } },
        },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (!isAdmin && project.sme.userId !== requesterUserId) {
        throw new Error('Unauthorized to create milestones for this project');
    }
    if (project.status !== client_1.ProjectStatus.DRAFT &&
        project.status !== client_1.ProjectStatus.UNDER_REVIEW &&
        project.status !== client_1.ProjectStatus.OPEN) {
        throw new Error('Milestones can only be added before the project is matched');
    }
    if (!milestones.length) {
        throw new Error('At least one milestone is required');
    }
    const startIndex = project.milestones.length;
    const created = await prisma_1.prisma.milestone.createMany({
        data: milestones.map((m, idx) => ({
            projectId,
            title: m.title.trim(),
            description: m.description.trim(),
            deadline: new Date(m.deadline),
            orderIndex: startIndex + idx + 1,
            amountVnd: m.amountVnd,
            status: client_1.MilestoneStatus.PENDING,
        })),
    });
    void created;
    return getMilestones(projectId);
}
async function submitDeliverable(milestoneId, studentUserId, deliverableUrl) {
    const milestone = await prisma_1.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
            project: {
                include: {
                    applications: true,
                },
            },
        },
    });
    if (!milestone) {
        throw new Error('Milestone not found');
    }
    if (milestone.project.status !== client_1.ProjectStatus.IN_PROGRESS) {
        throw new Error('Project is not in progress');
    }
    // Verify matched student
    const studentProfile = await prisma_1.prisma.studentProfile.findUnique({
        where: { userId: studentUserId },
    });
    if (!studentProfile) {
        throw new Error('Student profile not found');
    }
    const isMatched = milestone.project.applications.some((app) => app.studentId === studentProfile.id && app.status === 'ACCEPTED');
    if (!isMatched) {
        throw new Error('Unauthorized: you are not matched to this project');
    }
    if (milestone.status === client_1.MilestoneStatus.ACCEPTED) {
        throw new Error('Cannot submit to an already accepted milestone');
    }
    return await prisma_1.prisma.milestone.update({
        where: { id: milestoneId },
        data: {
            status: client_1.MilestoneStatus.SUBMITTED,
            deliverableUrl: deliverableUrl.trim(),
            submittedAt: new Date(),
        },
    });
}
async function cancelSubmission(milestoneId, studentUserId) {
    const milestone = await prisma_1.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
            project: {
                include: {
                    applications: true,
                },
            },
        },
    });
    if (!milestone) {
        throw new Error('Milestone not found');
    }
    if (milestone.project.status !== client_1.ProjectStatus.IN_PROGRESS) {
        throw new Error('Project is not in progress');
    }
    // Verify matched student
    const studentProfile = await prisma_1.prisma.studentProfile.findUnique({
        where: { userId: studentUserId },
    });
    if (!studentProfile) {
        throw new Error('Student profile not found');
    }
    const isMatched = milestone.project.applications.some((app) => app.studentId === studentProfile.id && app.status === 'ACCEPTED');
    if (!isMatched) {
        throw new Error('Unauthorized: you are not matched to this project');
    }
    if (milestone.status === client_1.MilestoneStatus.ACCEPTED) {
        throw new Error('Cannot cancel submission for an already accepted milestone');
    }
    return await prisma_1.prisma.milestone.update({
        where: { id: milestoneId },
        data: {
            status: client_1.MilestoneStatus.PENDING,
            deliverableUrl: null,
            submittedAt: null,
        },
    });
}
async function reviewMilestone(milestoneId, reviewerUserId, isAdmin, action, feedback) {
    const milestone = await prisma_1.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
            project: {
                include: {
                    sme: true,
                },
            },
        },
    });
    if (!milestone) {
        throw new Error('Milestone not found');
    }
    // Auth check: SME owner or Admin
    if (!isAdmin && milestone.project.sme.userId !== reviewerUserId) {
        throw new Error('Unauthorized to review this milestone');
    }
    if (milestone.status !== client_1.MilestoneStatus.SUBMITTED) {
        throw new Error('Milestone is not submitted for review');
    }
    if (action === 'APPROVE') {
        return await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Approve milestone
            const updatedMilestone = await tx.milestone.update({
                where: { id: milestoneId },
                data: {
                    status: client_1.MilestoneStatus.ACCEPTED,
                    revisionFeedback: null,
                },
            });
            // 2. Fetch all milestones for project
            const allMilestones = await tx.milestone.findMany({
                where: { projectId: milestone.projectId },
            });
            // Check if all are ACCEPTED (including the one we just updated)
            const allAccepted = allMilestones.every((m) => m.id === milestoneId ? true : m.status === client_1.MilestoneStatus.ACCEPTED);
            // 3. If all accepted, transition project status
            if (allAccepted) {
                await tx.project.update({
                    where: { id: milestone.projectId },
                    data: {
                        status: client_1.ProjectStatus.PENDING_ACCEPTANCE,
                    },
                });
                // Delete any existing reminders for this project to reset schedule
                await tx.acceptanceReminder.deleteMany({
                    where: { projectId: milestone.projectId },
                });
                // Insert fresh reminders
                const now = new Date();
                await tx.acceptanceReminder.createMany({
                    data: [
                        {
                            projectId: milestone.projectId,
                            reminderNumber: 1,
                            scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                        },
                        {
                            projectId: milestone.projectId,
                            reminderNumber: 2,
                            scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                        },
                        {
                            projectId: milestone.projectId,
                            reminderNumber: 3,
                            scheduledAt: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
                        },
                    ],
                });
            }
            return updatedMilestone;
        });
    }
    else {
        if (!feedback || !feedback.trim()) {
            throw new Error('Feedback is required to request revision');
        }
        return await prisma_1.prisma.milestone.update({
            where: { id: milestoneId },
            data: {
                status: client_1.MilestoneStatus.REVISION_REQUIRED,
                revisionFeedback: feedback.trim(),
            },
        });
    }
}
