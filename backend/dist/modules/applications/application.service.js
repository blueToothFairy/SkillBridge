"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToProject = applyToProject;
exports.getMyApplications = getMyApplications;
exports.getProjectApplicants = getProjectApplicants;
exports.updateApplicationStatus = updateApplicationStatus;
exports.confirmMatch = confirmMatch;
exports.withdrawApplication = withdrawApplication;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const skillMatch_1 = require("../../utils/skillMatch");
function withMatchScore(application) {
    const match = (0, skillMatch_1.computeSkillMatch)(application.project.requiredSkillTags, application.student.skills);
    return {
        ...application,
        matchScore: match.matchScore,
        matchingSkills: match.matchingSkills,
        matchingSkillsCount: match.matchingSkillsCount,
        totalRequiredSkills: match.totalRequiredSkills,
    };
}
async function applyToProject(userId, projectId, coverMessage) {
    const student = await prisma_1.prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) {
        throw new Error('Student profile not found');
    }
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: { _count: { select: { applications: true } } },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (project.status !== client_1.ProjectStatus.OPEN) {
        throw new Error('Project is not open for applications');
    }
    if (project.deadline.getTime() < Date.now()) {
        throw new Error('Project application deadline has passed');
    }
    if (project._count.applications >= project.maxApplicants * 5) {
        // Soft cap: allow more applicants than max hired; hard stop at 5x
        throw new Error('This project has reached the application limit');
    }
    const existing = await prisma_1.prisma.application.findUnique({
        where: {
            projectId_studentId: {
                projectId,
                studentId: student.id,
            },
        },
    });
    if (existing) {
        if (existing.status === client_1.ApplicationStatus.WITHDRAWN) {
            const reopened = await prisma_1.prisma.application.update({
                where: { id: existing.id },
                data: {
                    status: client_1.ApplicationStatus.APPLIED,
                    coverMessage: coverMessage?.trim() || existing.coverMessage,
                },
                include: {
                    project: { include: { categoryTag: true, sme: true } },
                    student: true,
                },
            });
            return withMatchScore(reopened);
        }
        throw new Error('You have already applied to this project');
    }
    const application = await prisma_1.prisma.application.create({
        data: {
            projectId,
            studentId: student.id,
            coverMessage: coverMessage?.trim() || null,
            status: client_1.ApplicationStatus.APPLIED,
        },
        include: {
            project: { include: { categoryTag: true, sme: true } },
            student: true,
        },
    });
    return withMatchScore(application);
}
async function getMyApplications(userId) {
    const student = await prisma_1.prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) {
        throw new Error('Student profile not found');
    }
    const applications = await prisma_1.prisma.application.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        include: {
            project: {
                include: {
                    categoryTag: true,
                    sme: { select: { id: true, companyName: true, industry: true, website: true } },
                },
            },
            student: true,
        },
    });
    return applications.map(withMatchScore);
}
async function getProjectApplicants(projectId, requesterUserId, isAdmin) {
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: { sme: true },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (!isAdmin && project.sme.userId !== requesterUserId) {
        throw new Error('Unauthorized to view applicants for this project');
    }
    const applications = await prisma_1.prisma.application.findMany({
        where: {
            projectId,
            status: { not: client_1.ApplicationStatus.WITHDRAWN },
        },
        include: {
            project: true,
            student: true,
        },
    });
    return applications
        .map(withMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore || b.createdAt.getTime() - a.createdAt.getTime());
}
async function updateApplicationStatus(applicationId, requesterUserId, isAdmin, status) {
    const application = await prisma_1.prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            project: { include: { sme: true } },
            student: true,
        },
    });
    if (!application) {
        throw new Error('Application not found');
    }
    if (!isAdmin && application.project.sme.userId !== requesterUserId) {
        throw new Error('Unauthorized to update this application');
    }
    if (application.project.status !== client_1.ProjectStatus.OPEN &&
        application.project.status !== client_1.ProjectStatus.MATCHED) {
        throw new Error('Cannot update applications after project has started');
    }
    if (application.status === client_1.ApplicationStatus.WITHDRAWN) {
        throw new Error('Cannot update a withdrawn application');
    }
    if (status === 'ACCEPTED') {
        const acceptedCount = await prisma_1.prisma.application.count({
            where: {
                projectId: application.projectId,
                status: client_1.ApplicationStatus.ACCEPTED,
                NOT: { id: applicationId },
            },
        });
        if (acceptedCount >= application.project.maxApplicants) {
            throw new Error(`Cannot accept more than ${application.project.maxApplicants} applicants`);
        }
    }
    const updated = await prisma_1.prisma.application.update({
        where: { id: applicationId },
        data: { status },
        include: {
            project: { include: { categoryTag: true, sme: true } },
            student: true,
        },
    });
    return withMatchScore(updated);
}
async function confirmMatch(projectId, requesterUserId, isAdmin, studentProfileIds) {
    if (!studentProfileIds.length) {
        throw new Error('At least one student must be selected');
    }
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: { sme: true },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (!isAdmin && project.sme.userId !== requesterUserId) {
        throw new Error('Unauthorized to confirm matching for this project');
    }
    if (project.status !== client_1.ProjectStatus.OPEN && project.status !== client_1.ProjectStatus.MATCHED) {
        throw new Error('Project is not open for matching');
    }
    if (studentProfileIds.length > project.maxApplicants) {
        throw new Error(`Cannot select more than ${project.maxApplicants} students`);
    }
    const applications = await prisma_1.prisma.application.findMany({
        where: {
            projectId,
            studentId: { in: studentProfileIds },
            status: { not: client_1.ApplicationStatus.WITHDRAWN },
        },
    });
    if (applications.length !== studentProfileIds.length) {
        throw new Error('One or more selected students have not applied to this project');
    }
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.application.updateMany({
            where: {
                projectId,
                studentId: { in: studentProfileIds },
            },
            data: { status: client_1.ApplicationStatus.ACCEPTED },
        });
        await tx.application.updateMany({
            where: {
                projectId,
                studentId: { notIn: studentProfileIds },
                status: { not: client_1.ApplicationStatus.WITHDRAWN },
            },
            data: { status: client_1.ApplicationStatus.REJECTED },
        });
        // If escrow already held, start project immediately; otherwise wait for deposit.
        const nextStatus = project.escrowStatus === client_1.EscrowStatus.HELD ? client_1.ProjectStatus.IN_PROGRESS : client_1.ProjectStatus.MATCHED;
        const updatedProject = await tx.project.update({
            where: { id: projectId },
            data: { status: nextStatus },
            include: {
                sme: true,
                categoryTag: true,
                applications: {
                    include: { student: true },
                },
                milestones: { orderBy: { orderIndex: 'asc' } },
            },
        });
        if (nextStatus === client_1.ProjectStatus.IN_PROGRESS) {
            const first = updatedProject.milestones[0];
            if (first && first.status === client_1.MilestoneStatus.PENDING) {
                await tx.milestone.update({
                    where: { id: first.id },
                    data: { status: client_1.MilestoneStatus.IN_PROGRESS },
                });
            }
        }
        return updatedProject;
    });
    const ranked = result.applications
        .filter((a) => a.status !== client_1.ApplicationStatus.WITHDRAWN)
        .map((a) => withMatchScore({
        ...a,
        project: result,
        student: a.student,
    }))
        .sort((a, b) => b.matchScore - a.matchScore);
    return {
        project: result,
        applications: ranked,
    };
}
async function withdrawApplication(applicationId, userId) {
    const student = await prisma_1.prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) {
        throw new Error('Student profile not found');
    }
    const application = await prisma_1.prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            project: { include: { categoryTag: true, sme: true } },
            student: true,
        },
    });
    if (!application) {
        throw new Error('Application not found');
    }
    if (application.studentId !== student.id) {
        throw new Error('Unauthorized to withdraw this application');
    }
    if (application.status !== client_1.ApplicationStatus.APPLIED &&
        application.status !== client_1.ApplicationStatus.SHORTLISTED) {
        throw new Error('Only APPLIED or SHORTLISTED applications can be withdrawn');
    }
    const updated = await prisma_1.prisma.application.update({
        where: { id: applicationId },
        data: { status: client_1.ApplicationStatus.WITHDRAWN },
        include: {
            project: { include: { categoryTag: true, sme: true } },
            student: true,
        },
    });
    return withMatchScore(updated);
}
