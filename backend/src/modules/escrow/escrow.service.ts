import { EscrowStatus, MilestoneStatus, ProjectStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

function isPendingEscrow(status: EscrowStatus) {
  return status === EscrowStatus.PENDING || status === EscrowStatus.NONE;
}

export async function getEscrowStatus(projectId: string, requesterUserId: string, role: string) {
  const project = await prisma.project.findUnique({
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
  const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: requesterUserId } });
  const isMatchedStudent =
    !!studentProfile &&
    project.applications.some((a) => a.studentId === studentProfile.id);

  if (role !== 'ADMIN' && !isOwner && !isMatchedStudent) {
    throw new Error('Unauthorized to view escrow status');
  }

  const totalBudget = Number(project.budget);
  // MVP escrow is lump-sum: funds stay fully held until project escrow is RELEASED.
  const heldAmount = project.escrowStatus === EscrowStatus.HELD ? totalBudget : 0;
  const releasedAmount = project.escrowStatus === EscrowStatus.RELEASED ? totalBudget : 0;

  const normalizedStatus =
    project.escrowStatus === EscrowStatus.NONE ? EscrowStatus.PENDING : project.escrowStatus;

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
      isFundReleased: project.escrowStatus === EscrowStatus.RELEASED,
    })),
    canDeposit:
      isOwner &&
      isPendingEscrow(project.escrowStatus) &&
      (project.status === ProjectStatus.MATCHED ||
        project.status === ProjectStatus.OPEN ||
        project.status === ProjectStatus.IN_PROGRESS),
    canRelease:
      isOwner &&
      project.escrowStatus === EscrowStatus.HELD &&
      (project.status === ProjectStatus.PENDING_ACCEPTANCE ||
        project.status === ProjectStatus.COMPLETED ||
        project.milestones.every((m) => m.status === MilestoneStatus.ACCEPTED)),
  };
}

export async function depositEscrow(projectId: string, requesterUserId: string, isAdmin: boolean) {
  const project = await prisma.project.findUnique({
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

  if (
    project.status !== ProjectStatus.MATCHED &&
    project.status !== ProjectStatus.OPEN &&
    project.status !== ProjectStatus.IN_PROGRESS
  ) {
    throw new Error('Project must be MATCHED (or ready) before depositing escrow');
  }

  // Prefer depositing after matching; allow OPEN only if there is at least one accepted applicant
  if (project.status === ProjectStatus.OPEN && project.applications.length === 0) {
    throw new Error('Confirm matching before depositing escrow');
  }

  const shouldStart =
    project.status === ProjectStatus.MATCHED ||
    (project.status === ProjectStatus.OPEN && project.applications.length > 0);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: projectId },
      data: {
        escrowStatus: EscrowStatus.HELD,
        ...(shouldStart ? { status: ProjectStatus.IN_PROGRESS } : {}),
      },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (shouldStart) {
      const first = updated.milestones[0];
      if (first && first.status === MilestoneStatus.PENDING) {
        await tx.milestone.update({
          where: { id: first.id },
          data: { status: MilestoneStatus.IN_PROGRESS },
        });
      }
    }
  });

  return getEscrowStatus(projectId, requesterUserId, isAdmin ? 'ADMIN' : 'SME');
}

export async function releaseEscrow(projectId: string, requesterUserId: string, isAdmin: boolean) {
  const project = await prisma.project.findUnique({
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

  if (project.escrowStatus !== EscrowStatus.HELD) {
    throw new Error('Escrow must be in HELD status to release');
  }

  const allMilestonesAccepted =
    project.milestones.length > 0 &&
    project.milestones.every((m) => m.status === MilestoneStatus.ACCEPTED);

  if (
    !isAdmin &&
    project.status !== ProjectStatus.PENDING_ACCEPTANCE &&
    project.status !== ProjectStatus.COMPLETED &&
    !allMilestonesAccepted
  ) {
    throw new Error('Escrow can only be released after all milestones are accepted');
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      escrowStatus: EscrowStatus.RELEASED,
      // Full project acceptance (COMPLETED) remains Thịnh Day-27; release alone unlocks funds.
    },
  });

  return getEscrowStatus(projectId, requesterUserId, isAdmin ? 'ADMIN' : 'SME');
}
