import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProjectInput {
  title: string;
  description: string;
  categoryTagId: string;
  requiredSkillTags: string[];
  budget: number;
  durationWeeks: number;
  maxApplicants?: number;
  deadline?: string | Date;
}

export async function createProject(userId: string, input: CreateProjectInput) {
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
      status: ProjectStatus.UNDER_REVIEW,
    },
    include: {
      sme: true,
      categoryTag: true,
    },
  });
}

export async function getProjects(params: {
  categoryTagId?: string;
  query?: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.status) {
    where.status = params.status;
  } else {
    // Default to OPEN projects for public browse unless specified
    where.status = ProjectStatus.OPEN;
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

export async function getProjectById(id: string) {
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

export async function updateProject(id: string, userId: string, data: Partial<CreateProjectInput> & { status?: ProjectStatus }) {
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

  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.categoryTagId) updateData.categoryTagId = data.categoryTagId;
  if (data.requiredSkillTags) updateData.requiredSkillTags = data.requiredSkillTags;
  if (data.budget !== undefined) updateData.budget = data.budget;
  if (data.durationWeeks !== undefined) updateData.durationWeeks = data.durationWeeks;
  if (data.maxApplicants !== undefined) updateData.maxApplicants = data.maxApplicants;
  if (data.deadline) updateData.deadline = new Date(data.deadline);

  // If the SME edits details of an OPEN or DRAFT project, return it to UNDER_REVIEW
  if (project.status === ProjectStatus.OPEN || project.status === ProjectStatus.DRAFT) {
    updateData.status = ProjectStatus.UNDER_REVIEW;
  } else if (data.status) {
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

export async function getPendingProjects() {
  return await prisma.project.findMany({
    where: { status: ProjectStatus.UNDER_REVIEW },
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

export async function reviewProject(id: string, action: 'APPROVE' | 'REJECT') {
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.status !== ProjectStatus.UNDER_REVIEW) {
    throw new Error('Project is not under review');
  }

  const status = action === 'APPROVE' ? ProjectStatus.OPEN : ProjectStatus.DRAFT;

  return await prisma.project.update({
    where: { id },
    data: { status },
    include: {
      sme: true,
      categoryTag: true,
    },
  });
}
