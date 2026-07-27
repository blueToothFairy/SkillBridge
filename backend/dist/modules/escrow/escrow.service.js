"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEscrowStatus = getEscrowStatus;
exports.depositEscrow = depositEscrow;
exports.releaseEscrow = releaseEscrow;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
function isPendingEscrow(status) {
    return status === client_1.EscrowStatus.PENDING || status === client_1.EscrowStatus.NONE;
}
async function getEscrowStatus(projectId, requesterUserId, role) {
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            sme: true,
            milestones: { orderBy: { orderIndex: 'asc' } },
            applications: {
                where: { status: 'ACCEPTED' },
                include: { student: true },
            },
        },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    const isOwner = project.sme.userId === requesterUserId;
    const studentProfile = await prisma_1.prisma.studentProfile.findUnique({ where: { userId: requesterUserId } });
    const isMatchedStudent = !!studentProfile &&
        project.applications.some((a) => a.studentId === studentProfile.id);
    if (role !== 'ADMIN' && !isOwner && !isMatchedStudent) {
        throw new Error('Unauthorized to view escrow status');
    }
    const totalBudget = Number(project.budget);
    const releasedByMilestones = project.milestones
        .filter((m) => m.status === client_1.MilestoneStatus.ACCEPTED)
        .reduce((sum, m) => sum + Number(m.amountVnd), 0);
    const heldAmount = isPendingEscrow(project.escrowStatus)
        ? 0
        : project.escrowStatus === client_1.EscrowStatus.RELEASED
            ? 0
            : Math.max(totalBudget - releasedByMilestones, 0);
    const releasedAmount = project.escrowStatus === client_1.EscrowStatus.RELEASED ? totalBudget : releasedByMilestones;
    const normalizedStatus = project.escrowStatus === client_1.EscrowStatus.NONE ? client_1.EscrowStatus.PENDING : project.escrowStatus;
    return {
        projectId: project.id,
        projectTitle: project.title,
        projectStatus: project.status,
        escrowStatus: normalizedStatus,
        totalBudget,
        heldAmount,
        releasedAmount,
        milestones: project.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            amountVnd: Number(m.amountVnd),
            status: m.status,
            isFundReleased: m.status === client_1.MilestoneStatus.ACCEPTED || project.escrowStatus === client_1.EscrowStatus.RELEASED,
        })),
        canDeposit: isOwner &&
            isPendingEscrow(project.escrowStatus) &&
            (project.status === client_1.ProjectStatus.MATCHED ||
                project.status === client_1.ProjectStatus.OPEN ||
                project.status === client_1.ProjectStatus.IN_PROGRESS),
        canRelease: isOwner &&
            project.escrowStatus === client_1.EscrowStatus.HELD &&
            (project.status === client_1.ProjectStatus.PENDING_ACCEPTANCE ||
                project.status === client_1.ProjectStatus.COMPLETED ||
                project.milestones.every((m) => m.status === client_1.MilestoneStatus.ACCEPTED)),
    };
}
async function depositEscrow(projectId, requesterUserId, isAdmin) {
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            sme: true,
            milestones: { orderBy: { orderIndex: 'asc' } },
            applications: { where: { status: 'ACCEPTED' } },
        },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (!isAdmin && project.sme.userId !== requesterUserId) {
        throw new Error('Unauthorized to deposit escrow for this project');
    }
    if (!isPendingEscrow(project.escrowStatus)) {
        throw new Error('Escrow has already been deposited or released');
    }
    if (project.status !== client_1.ProjectStatus.MATCHED &&
        project.status !== client_1.ProjectStatus.OPEN &&
        project.status !== client_1.ProjectStatus.IN_PROGRESS) {
        throw new Error('Project must be MATCHED (or ready) before depositing escrow');
    }
    // Prefer depositing after matching; allow OPEN only if there is at least one accepted applicant
    if (project.status === client_1.ProjectStatus.OPEN && project.applications.length === 0) {
        throw new Error('Confirm matching before depositing escrow');
    }
    const shouldStart = project.status === client_1.ProjectStatus.MATCHED ||
        (project.status === client_1.ProjectStatus.OPEN && project.applications.length > 0);
    await prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.project.update({
            where: { id: projectId },
            data: {
                escrowStatus: client_1.EscrowStatus.HELD,
                ...(shouldStart ? { status: client_1.ProjectStatus.IN_PROGRESS } : {}),
            },
            include: {
                milestones: { orderBy: { orderIndex: 'asc' } },
            },
        });
        if (shouldStart) {
            const first = updated.milestones[0];
            if (first && first.status === client_1.MilestoneStatus.PENDING) {
                await tx.milestone.update({
                    where: { id: first.id },
                    data: { status: client_1.MilestoneStatus.IN_PROGRESS },
                });
            }
        }
    });
    return getEscrowStatus(projectId, requesterUserId, isAdmin ? 'ADMIN' : 'SME');
}
async function releaseEscrow(projectId, requesterUserId, isAdmin) {
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            sme: true,
            milestones: true,
        },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (!isAdmin && project.sme.userId !== requesterUserId) {
        throw new Error('Unauthorized to release escrow for this project');
    }
    if (project.escrowStatus !== client_1.EscrowStatus.HELD) {
        throw new Error('Escrow must be in HELD status to release');
    }
    const allMilestonesAccepted = project.milestones.length > 0 &&
        project.milestones.every((m) => m.status === client_1.MilestoneStatus.ACCEPTED);
    if (!isAdmin &&
        project.status !== client_1.ProjectStatus.PENDING_ACCEPTANCE &&
        project.status !== client_1.ProjectStatus.COMPLETED &&
        !allMilestonesAccepted) {
        throw new Error('Escrow can only be released after all milestones are accepted');
    }
    await prisma_1.prisma.project.update({
        where: { id: projectId },
        data: {
            escrowStatus: client_1.EscrowStatus.RELEASED,
            // Full project acceptance (COMPLETED) remains Thịnh Day-27; release alone unlocks funds.
        },
    });
    return getEscrowStatus(projectId, requesterUserId, isAdmin ? 'ADMIN' : 'SME');
}
