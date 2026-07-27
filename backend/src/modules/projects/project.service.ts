import { ProjectStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface CreateMilestoneInput {
  title: string;
  description: string;
  deadline: string | Date;
  amountVnd: number;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  categoryTagId: string;
  requiredSkillTags: string[];
  budget: number;
  durationWeeks: number;
  maxApplicants?: number;
  deadline?: string | Date;
  milestones?: CreateMilestoneInput[];
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
    : new Date(Date.now() + Number(input.durationWeeks) * 7 * 24 * 60 * 60 * 1000);

  return await prisma.project.create({
    data: {
      smeId: smeProfile.id,
      title: input.title.trim(),
      description: input.description.trim(),
      categoryTagId: input.categoryTagId,
      requiredSkillTags: input.requiredSkillTags || [],
      budget: input.budget,
      durationWeeks: input.durationWeeks,
      maxApplicants: input.maxApplicants || 4,
      deadline: deadlineDate,
      status: ProjectStatus.UNDER_REVIEW,
      milestones: input.milestones && input.milestones.length > 0 ? {
        create: input.milestones.map((m, idx) => ({
          title: m.title.trim(),
          description: m.description.trim(),
          deadline: new Date(m.deadline),
          orderIndex: idx + 1,
          status: 'PENDING',
          amountVnd: m.amountVnd,
        }))
      } : undefined,
    },
    include: {
      sme: true,
      categoryTag: true,
      milestones: true,
    },
  });
}

export async function getProjects(params: {
  categoryTagId?: string;
  query?: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
  smeUserId?: string;
  smeId?: string;
}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.smeUserId) {
    where.sme = { userId: params.smeUserId };
  } else if (params.smeId) {
    where.smeId = params.smeId;
  }

  if (params.status) {
    where.status = params.status;
  } else if (!params.smeUserId && !params.smeId) {
    // Default to OPEN projects for public browse unless SME "mine" filter
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
      milestones: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
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

export async function acceptProject(id: string, requesterUserId: string, isAdmin: boolean) {
  const project = await prisma.project.findUnique({
    where: { id },
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

  if (!isAdmin && project.sme.userId !== requesterUserId) {
    throw new Error('Unauthorized to accept this project');
  }

  if (project.status !== ProjectStatus.PENDING_ACCEPTANCE) {
    throw new Error('Project is not in pending acceptance status');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update Project Status to COMPLETED, escrowStatus to RELEASED
    const updatedProject = await tx.project.update({
      where: { id },
      data: {
        status: ProjectStatus.COMPLETED,
        escrowStatus: 'RELEASED',
        acceptedAt: new Date(),
        isAutoAccepted: false,
      },
      include: {
        sme: true,
        categoryTag: true,
        milestones: { orderBy: { orderIndex: 'asc' } },
      },
    });

    // 2. Mark active scheduled reminders for this project as triggered/processed
    await tx.acceptanceReminder.updateMany({
      where: {
        projectId: id,
        triggeredAt: null,
      },
      data: {
        triggeredAt: new Date(),
      },
    });

    const lastMilestone = project.milestones[project.milestones.length - 1];
    const finalDeliverableUrl = lastMilestone?.deliverableUrl || null;

    // 3. For each accepted student application, create VerifiedPortfolioEntry & Certificate stub
    for (const app of project.applications) {
      // Create VerifiedPortfolioEntry if not already exists
      const existingPortfolio = await tx.verifiedPortfolioEntry.findUnique({
        where: {
          studentId_projectId: {
            studentId: app.studentId,
            projectId: id,
          },
        },
      });

      if (!existingPortfolio) {
        await tx.verifiedPortfolioEntry.create({
          data: {
            studentId: app.studentId,
            projectId: id,
            projectTitle: project.title,
            smeName: project.sme.companyName,
            studentRole: 'Contributor',
            durationWeeks: project.durationWeeks,
            skillsApplied: project.requiredSkillTags || [],
            deliverableUrl: finalDeliverableUrl,
            isVerified: true,
          },
        });
      }

      // Create stub Certificate
      const existingCert = await tx.certificate.findUnique({
        where: {
          studentId_projectId: {
            studentId: app.studentId,
            projectId: id,
          },
        },
      });

      if (!existingCert) {
        await tx.certificate.create({
          data: {
            studentId: app.studentId,
            projectId: id,
            studentName: app.student.fullName,
            projectTitle: project.title,
            smeName: project.sme.companyName,
            verificationCode: `SB-CERT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        });
      }
    }

    return updatedProject;
  });
}

export async function requestProjectRevision(id: string, requesterUserId: string, isAdmin: boolean, feedback: string) {
  if (!feedback || feedback.trim().length < 10) {
    throw new Error('Feedback must be at least 10 characters long');
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sme: true,
      milestones: { orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (!isAdmin && project.sme.userId !== requesterUserId) {
    throw new Error('Unauthorized to request revision for this project');
  }

  if (project.status !== ProjectStatus.PENDING_ACCEPTANCE) {
    throw new Error('Project is not in pending acceptance status');
  }

  const lastMilestone = project.milestones[project.milestones.length - 1];
  if (!lastMilestone) {
    throw new Error('No milestones found for this project');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update Project Status to IN_PROGRESS
    const updatedProject = await tx.project.update({
      where: { id },
      data: {
        status: ProjectStatus.IN_PROGRESS,
      },
      include: {
        sme: true,
        categoryTag: true,
        milestones: { orderBy: { orderIndex: 'asc' } },
      },
    });

    // 2. Update the last milestone to REVISION_REQUIRED
    await tx.milestone.update({
      where: { id: lastMilestone.id },
      data: {
        status: 'REVISION_REQUIRED',
        revisionFeedback: feedback.trim(),
      },
    });

    // 3. Delete scheduled reminders for this project
    await tx.acceptanceReminder.deleteMany({
      where: {
        projectId: id,
      },
    });

    return updatedProject;
  });
}
