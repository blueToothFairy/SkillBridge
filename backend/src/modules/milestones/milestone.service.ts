import { MilestoneStatus, ProjectStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface CreateMilestoneInput {
  title: string;
  description: string;
  deadline: string | Date;
  amountVnd: number;
}

export async function getMilestones(projectId: string) {
  return await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
  });
}

export async function createMilestones(
  projectId: string,
  requesterUserId: string,
  isAdmin: boolean,
  milestones: CreateMilestoneInput[]
) {
  const project = await prisma.project.findUnique({
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

  if (
    project.status !== ProjectStatus.DRAFT &&
    project.status !== ProjectStatus.UNDER_REVIEW &&
    project.status !== ProjectStatus.OPEN
  ) {
    throw new Error('Milestones can only be added before the project is matched');
  }

  if (!milestones.length) {
    throw new Error('At least one milestone is required');
  }

  const startIndex = project.milestones.length;
  const created = await prisma.milestone.createMany({
    data: milestones.map((m, idx) => ({
      projectId,
      title: m.title.trim(),
      description: m.description.trim(),
      deadline: new Date(m.deadline),
      orderIndex: startIndex + idx + 1,
      amountVnd: m.amountVnd,
      status: MilestoneStatus.PENDING,
    })),
  });

  void created;
  return getMilestones(projectId);
}

export async function submitDeliverable(milestoneId: string, studentUserId: string, deliverableUrl: string) {
  const milestone = await prisma.milestone.findUnique({
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

  if (milestone.project.status !== ProjectStatus.IN_PROGRESS) {
    throw new Error('Project is not in progress');
  }

  // Verify matched student
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });

  if (!studentProfile) {
    throw new Error('Student profile not found');
  }

  const isMatched = milestone.project.applications.some(
    (app) => app.studentId === studentProfile.id && app.status === 'ACCEPTED'
  );

  if (!isMatched) {
    throw new Error('Unauthorized: you are not matched to this project');
  }

  if (milestone.status === MilestoneStatus.ACCEPTED) {
    throw new Error('Cannot submit to an already accepted milestone');
  }

  return await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: MilestoneStatus.SUBMITTED,
      deliverableUrl: deliverableUrl.trim(),
      submittedAt: new Date(),
    },
  });
}

export async function cancelSubmission(milestoneId: string, studentUserId: string) {
  const milestone = await prisma.milestone.findUnique({
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

  if (milestone.project.status !== ProjectStatus.IN_PROGRESS) {
    throw new Error('Project is not in progress');
  }

  // Verify matched student
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });

  if (!studentProfile) {
    throw new Error('Student profile not found');
  }

  const isMatched = milestone.project.applications.some(
    (app) => app.studentId === studentProfile.id && app.status === 'ACCEPTED'
  );

  if (!isMatched) {
    throw new Error('Unauthorized: you are not matched to this project');
  }

  if (milestone.status === MilestoneStatus.ACCEPTED) {
    throw new Error('Cannot cancel submission for an already accepted milestone');
  }

  return await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: MilestoneStatus.PENDING,
      deliverableUrl: null,
      submittedAt: null,
    },
  });
}

export async function reviewMilestone(
  milestoneId: string,
  reviewerUserId: string,
  isAdmin: boolean,
  action: 'APPROVE' | 'REVISE',
  feedback?: string
) {
  const milestone = await prisma.milestone.findUnique({
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

  if (milestone.status !== MilestoneStatus.SUBMITTED) {
    throw new Error('Milestone is not submitted for review');
  }

  if (action === 'APPROVE') {
    return await prisma.$transaction(async (tx) => {
      // 1. Approve milestone
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.ACCEPTED,
          revisionFeedback: null,
        },
      });

      // 2. Fetch all milestones for project
      const allMilestones = await tx.milestone.findMany({
        where: { projectId: milestone.projectId },
      });

      // Check if all are ACCEPTED (including the one we just updated)
      const allAccepted = allMilestones.every((m) =>
        m.id === milestoneId ? true : m.status === MilestoneStatus.ACCEPTED
      );

      // 3. If all accepted, transition project status
      if (allAccepted) {
        await tx.project.update({
          where: { id: milestone.projectId },
          data: {
            status: ProjectStatus.PENDING_ACCEPTANCE,
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
  } else {
    if (!feedback || !feedback.trim()) {
      throw new Error('Feedback is required to request revision');
    }

    return await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.REVISION_REQUIRED,
        revisionFeedback: feedback.trim(),
      },
    });
  }
}
