import {
  ApplicationStatus,
  EscrowStatus,
  MilestoneStatus,
  ProjectStatus,
} from '@prisma/client';
import { prisma } from '../../config/prisma';
import { computeSkillMatch } from '../../utils/skillMatch';

function withMatchScore<T extends { project: { requiredSkillTags: unknown }; student: { skills: unknown } }>(
  application: T
) {
  const match = computeSkillMatch(application.project.requiredSkillTags, application.student.skills);
  return {
    ...application,
    matchScore: match.matchScore,
    matchingSkills: match.matchingSkills,
    matchingSkillsCount: match.matchingSkillsCount,
    totalRequiredSkills: match.totalRequiredSkills,
  };
}

export async function applyToProject(
  userId: string,
  projectId: string,
  coverMessage?: string
) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) {
    throw new Error('Student profile not found');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { applications: true } } },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.status !== ProjectStatus.OPEN) {
    throw new Error('Project is not open for applications');
  }

  if (project.deadline.getTime() < Date.now()) {
    throw new Error('Project application deadline has passed');
  }

  if (project._count.applications >= project.maxApplicants * 5) {
    // Soft cap: allow more applicants than max hired; hard stop at 5x
    throw new Error('This project has reached the application limit');
  }

  const existing = await prisma.application.findUnique({
    where: {
      projectId_studentId: {
        projectId,
        studentId: student.id,
      },
    },
  });

  if (existing) {
    if (existing.status === ApplicationStatus.WITHDRAWN) {
      const reopened = await prisma.application.update({
        where: { id: existing.id },
        data: {
          status: ApplicationStatus.APPLIED,
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

  const application = await prisma.application.create({
    data: {
      projectId,
      studentId: student.id,
      coverMessage: coverMessage?.trim() || null,
      status: ApplicationStatus.APPLIED,
    },
    include: {
      project: { include: { categoryTag: true, sme: true } },
      student: true,
    },
  });

  return withMatchScore(application);
}

export async function getMyApplications(userId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) {
    throw new Error('Student profile not found');
  }

  const applications = await prisma.application.findMany({
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

export async function getProjectApplicants(projectId: string, requesterUserId: string, isAdmin: boolean) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { sme: true },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (!isAdmin && project.sme.userId !== requesterUserId) {
    throw new Error('Unauthorized to view applicants for this project');
  }

  const applications = await prisma.application.findMany({
    where: {
      projectId,
      status: { not: ApplicationStatus.WITHDRAWN },
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

export async function updateApplicationStatus(
  applicationId: string,
  requesterUserId: string,
  isAdmin: boolean,
  status: 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED'
) {
  const application = await prisma.application.findUnique({
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

  if (
    application.project.status !== ProjectStatus.OPEN &&
    application.project.status !== ProjectStatus.MATCHED
  ) {
    throw new Error('Cannot update applications after project has started');
  }

  if (application.status === ApplicationStatus.WITHDRAWN) {
    throw new Error('Cannot update a withdrawn application');
  }

  if (status === 'ACCEPTED') {
    const acceptedCount = await prisma.application.count({
      where: {
        projectId: application.projectId,
        status: ApplicationStatus.ACCEPTED,
        NOT: { id: applicationId },
      },
    });
    if (acceptedCount >= application.project.maxApplicants) {
      throw new Error(`Cannot accept more than ${application.project.maxApplicants} applicants`);
    }
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status },
    include: {
      project: { include: { categoryTag: true, sme: true } },
      student: true,
    },
  });

  return withMatchScore(updated);
}

export async function confirmMatch(
  projectId: string,
  requesterUserId: string,
  isAdmin: boolean,
  studentProfileIds: string[]
) {
  if (!studentProfileIds.length) {
    throw new Error('At least one student must be selected');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { sme: true },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (!isAdmin && project.sme.userId !== requesterUserId) {
    throw new Error('Unauthorized to confirm matching for this project');
  }

  if (project.status !== ProjectStatus.OPEN && project.status !== ProjectStatus.MATCHED) {
    throw new Error('Project is not open for matching');
  }

  if (studentProfileIds.length > project.maxApplicants) {
    throw new Error(`Cannot select more than ${project.maxApplicants} students`);
  }

  const applications = await prisma.application.findMany({
    where: {
      projectId,
      studentId: { in: studentProfileIds },
      status: { not: ApplicationStatus.WITHDRAWN },
    },
  });

  if (applications.length !== studentProfileIds.length) {
    throw new Error('One or more selected students have not applied to this project');
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.application.updateMany({
      where: {
        projectId,
        studentId: { in: studentProfileIds },
      },
      data: { status: ApplicationStatus.ACCEPTED },
    });

    await tx.application.updateMany({
      where: {
        projectId,
        studentId: { notIn: studentProfileIds },
        status: { not: ApplicationStatus.WITHDRAWN },
      },
      data: { status: ApplicationStatus.REJECTED },
    });

    // If escrow already held, start project immediately; otherwise wait for deposit.
    const nextStatus =
      project.escrowStatus === EscrowStatus.HELD ? ProjectStatus.IN_PROGRESS : ProjectStatus.MATCHED;

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

    if (nextStatus === ProjectStatus.IN_PROGRESS) {
      const first = updatedProject.milestones[0];
      if (first && first.status === MilestoneStatus.PENDING) {
        await tx.milestone.update({
          where: { id: first.id },
          data: { status: MilestoneStatus.IN_PROGRESS },
        });
      }
    }

    return updatedProject;
  });

  const ranked = result.applications
    .filter((a) => a.status !== ApplicationStatus.WITHDRAWN)
    .map((a) =>
      withMatchScore({
        ...a,
        project: result,
        student: a.student,
      })
    )
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    project: result,
    applications: ranked,
  };
}

export async function withdrawApplication(applicationId: string, userId: string) {
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) {
    throw new Error('Student profile not found');
  }

  const application = await prisma.application.findUnique({
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

  if (
    application.status !== ApplicationStatus.APPLIED &&
    application.status !== ApplicationStatus.SHORTLISTED
  ) {
    throw new Error('Only APPLIED or SHORTLISTED applications can be withdrawn');
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: ApplicationStatus.WITHDRAWN },
    include: {
      project: { include: { categoryTag: true, sme: true } },
      student: true,
    },
  });

  return withMatchScore(updated);
}
