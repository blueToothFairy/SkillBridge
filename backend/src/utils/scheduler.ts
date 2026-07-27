import { prisma } from '../config/prisma';
import { ProjectStatus } from '@prisma/client';
import { logger } from './logger';

export interface SchedulerSummary {
  remindersChecked: number;
  remindersTriggered: number;
  details: string[];
}

export async function runAcceptanceRemindersJob(): Promise<SchedulerSummary> {
  const now = new Date();
  const summary: SchedulerSummary = {
    remindersChecked: 0,
    remindersTriggered: 0,
    details: [],
  };

  try {
    const dueReminders = await prisma.acceptanceReminder.findMany({
      where: {
        triggeredAt: null,
        scheduledAt: { lte: now },
      },
      include: {
        project: {
          include: {
            sme: true,
            milestones: { orderBy: { orderIndex: 'asc' } },
            applications: {
              where: { status: 'ACCEPTED' },
              include: { student: true },
            },
          },
        },
      },
    });

    summary.remindersChecked = dueReminders.length;

    for (const r of dueReminders) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Mark this reminder as triggered
          await tx.acceptanceReminder.update({
            where: { id: r.id },
            data: { triggeredAt: now },
          });

          // 2. Perform action based on reminder level
          if (r.reminderNumber === 1) {
            const msg = `[Reminder #1] Project "${r.project.title}" has been in PENDING_ACCEPTANCE for 7 days. SME notification logged.`;
            logger.info(msg);
            summary.details.push(msg);
          } else if (r.reminderNumber === 2) {
            const msg = `[Reminder #2] Project "${r.project.title}" has been in PENDING_ACCEPTANCE for 14 days. Auto-accept warning logged.`;
            logger.info(msg);
            summary.details.push(msg);
          } else if (r.reminderNumber === 3) {
            // Day 28: Auto-Accept
            const msg = `[Auto-Accept] Project "${r.project.title}" is being auto-accepted after 28 days of inactivity.`;
            logger.info(msg);
            summary.details.push(msg);

            // Update project status to COMPLETED and release escrow
            await tx.project.update({
              where: { id: r.projectId },
              data: {
                status: ProjectStatus.COMPLETED,
                escrowStatus: 'RELEASED',
                acceptedAt: now,
                isAutoAccepted: true,
              },
            });

            // Cancel any other untriggered reminders for this project
            await tx.acceptanceReminder.updateMany({
              where: {
                projectId: r.projectId,
                triggeredAt: null,
                id: { not: r.id },
              },
              data: {
                triggeredAt: now,
              },
            });

            // Generate verified portfolios and certificate stubs
            const lastMilestone = r.project.milestones[r.project.milestones.length - 1];
            const finalDeliverableUrl = lastMilestone?.deliverableUrl || null;

            for (const app of r.project.applications) {
              // Create VerifiedPortfolioEntry
              const existingPortfolio = await tx.verifiedPortfolioEntry.findUnique({
                where: {
                  studentId_projectId: {
                    studentId: app.studentId,
                    projectId: r.projectId,
                  },
                },
              });

              if (!existingPortfolio) {
                await tx.verifiedPortfolioEntry.create({
                  data: {
                    studentId: app.studentId,
                    projectId: r.projectId,
                    projectTitle: r.project.title,
                    smeName: r.project.sme.companyName,
                    studentRole: 'Contributor',
                    durationWeeks: r.project.durationWeeks,
                    skillsApplied: r.project.requiredSkillTags || [],
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
                    projectId: r.projectId,
                  },
                },
              });

              if (!existingCert) {
                await tx.certificate.create({
                  data: {
                    studentId: app.studentId,
                    projectId: r.projectId,
                    studentName: app.student.fullName,
                    projectTitle: r.project.title,
                    smeName: r.project.sme.companyName,
                    verificationCode: `SB-CERT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                  },
                });
              }
            }
          }
        });
        summary.remindersTriggered++;
      } catch (err: any) {
        const errorMsg = `Failed to process reminder id ${r.id} for project id ${r.projectId}: ${err.message}`;
        logger.error(errorMsg);
        summary.details.push(errorMsg);
      }
    }
  } catch (error: any) {
    logger.error(`Error in runAcceptanceRemindersJob: ${error.message}`);
    summary.details.push(`Job execution error: ${error.message}`);
  }

  return summary;
}
