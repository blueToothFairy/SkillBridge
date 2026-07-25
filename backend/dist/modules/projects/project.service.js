"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.getPendingProjects = getPendingProjects;
exports.reviewProject = reviewProject;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createProject(userId, input) {
    // Find SME Profile for user
    const smeProfile = await prisma.smeProfile.findUnique({
        where: { userId },
    });
    if (!smeProfile) {
        throw new Error('SME profile not found for this user');
    }
    const deadlineDate = input.deadline
        ? new Date(input.deadline)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return await prisma.project.create({
        data: {
            smeId: smeProfile.id,
            title: input.title.trim(),
            description: input.description.trim(),
            categoryTagId: input.categoryTagId,
            requiredSkillTags: input.requiredSkillTags || [],
            budget: input.budget,
            durationWeeks: input.durationWeeks,
            maxApplicants: input.maxApplicants || 5,
            deadline: deadlineDate,
            status: client_1.ProjectStatus.UNDER_REVIEW,
        },
        include: {
            sme: true,
            categoryTag: true,
        },
    });
}
async function getProjects(params) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const where = {};
    if (params.status) {
        where.status = params.status;
    }
    else {
        // Default to OPEN projects for public browse unless specified
        where.status = client_1.ProjectStatus.OPEN;
    }
    if (params.categoryTagId) {
        where.categoryTagId = params.categoryTagId;
    }
    if (params.query) {
        where.OR = [
            { title: { contains: params.query, mode: 'insensitive' } },
            { description: { contains: params.query, mode: 'insensitive' } },
        ];
    }
    const [total, projects] = await Promise.all([
        prisma.project.count({ where }),
        prisma.project.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                sme: {
                    select: {
                        id: true,
                        companyName: true,
                        industry: true,
                        website: true,
                    },
                },
                categoryTag: true,
            },
        }),
    ]);
    return {
        projects,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}
async function getProjectById(id) {
    return await prisma.project.findUnique({
        where: { id },
        include: {
            sme: {
                select: {
                    id: true,
                    companyName: true,
                    industry: true,
                    website: true,
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
            },
            categoryTag: true,
        },
    });
}
async function updateProject(id, userId, data) {
    const project = await prisma.project.findUnique({
        where: { id },
        include: { sme: true },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (project.sme.userId !== userId) {
        throw new Error('Unauthorized to edit this project');
    }
    const updateData = {};
    if (data.title)
        updateData.title = data.title;
    if (data.description)
        updateData.description = data.description;
    if (data.categoryTagId)
        updateData.categoryTagId = data.categoryTagId;
    if (data.requiredSkillTags)
        updateData.requiredSkillTags = data.requiredSkillTags;
    if (data.budget !== undefined)
        updateData.budget = data.budget;
    if (data.durationWeeks !== undefined)
        updateData.durationWeeks = data.durationWeeks;
    if (data.maxApplicants !== undefined)
        updateData.maxApplicants = data.maxApplicants;
    if (data.deadline)
        updateData.deadline = new Date(data.deadline);
    // If the SME edits details of an OPEN or DRAFT project, return it to UNDER_REVIEW
    if (project.status === client_1.ProjectStatus.OPEN || project.status === client_1.ProjectStatus.DRAFT) {
        updateData.status = client_1.ProjectStatus.UNDER_REVIEW;
    }
    else if (data.status) {
        updateData.status = data.status;
    }
    return await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
            sme: true,
            categoryTag: true,
        },
    });
}
async function getPendingProjects() {
    return await prisma.project.findMany({
        where: { status: client_1.ProjectStatus.UNDER_REVIEW },
        orderBy: { createdAt: 'desc' },
        include: {
            sme: {
                select: {
                    id: true,
                    companyName: true,
                    industry: true,
                    website: true,
                },
            },
            categoryTag: true,
        },
    });
}
async function reviewProject(id, action) {
    const project = await prisma.project.findUnique({
        where: { id },
    });
    if (!project) {
        throw new Error('Project not found');
    }
    if (project.status !== client_1.ProjectStatus.UNDER_REVIEW) {
        throw new Error('Project is not under review');
    }
    const status = action === 'APPROVE' ? client_1.ProjectStatus.OPEN : client_1.ProjectStatus.DRAFT;
    return await prisma.project.update({
        where: { id },
        data: { status },
        include: {
            sme: true,
            categoryTag: true,
        },
    });
}
