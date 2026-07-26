import { PrismaClient, MilestoneStatus, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMilestones(projectId: string) {
  return await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
  });
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
