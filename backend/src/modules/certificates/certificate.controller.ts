import { Response } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middlewares/auth';

function mapCertificate(cert: any) {
  return {
    id: cert.id,
    certificateNumber: cert.verificationCode,
    studentName: cert.studentName,
    university: cert.student?.university || '',
    projectTitle: cert.projectTitle,
    smeCompany: cert.smeName,
    issueDate: cert.issuedAt.toISOString().split('T')[0],
    skillsVerified: cert.project?.requiredSkillTags || [],
    verificationCode: cert.verificationCode,
  };
}

function buildVerificationCode() {
  return `SB-CERT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function issueCertificate(req: AuthenticatedRequest, res: Response) {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { studentId, projectId } = req.body;

    if (!requesterId || !requesterRole) {
      return sendError(res, 'User identity unverified', 401, 'UNAUTHORIZED');
    }
    if (!studentId || !projectId) {
      return sendError(res, 'studentId and projectId are required', 400, 'VALIDATION_ERROR');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sme: true,
      },
    });

    if (!project) {
      return sendError(res, 'Project not found', 404, 'NOT_FOUND');
    }

    if (requesterRole !== 'ADMIN' && project.sme.userId !== requesterId) {
      return sendError(res, 'Unauthorized to issue certificate for this project', 403, 'FORBIDDEN');
    }

    const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
    if (!student) {
      return sendError(res, 'Student profile not found', 404, 'NOT_FOUND');
    }

    const existing = await prisma.certificate.findUnique({
      where: {
        studentId_projectId: {
          studentId,
          projectId,
        },
      },
      include: {
        student: { select: { university: true } },
        project: { select: { requiredSkillTags: true } },
      },
    });

    if (existing) {
      return sendSuccess(res, mapCertificate(existing));
    }

    const created = await prisma.certificate.create({
      data: {
        studentId,
        projectId,
        studentName: student.fullName,
        projectTitle: project.title,
        smeName: project.sme.companyName,
        verificationCode: buildVerificationCode(),
      },
      include: {
        student: { select: { university: true } },
        project: { select: { requiredSkillTags: true } },
      },
    });

    return sendSuccess(res, mapCertificate(created), 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to issue certificate', 500, 'SERVER_ERROR');
  }
}

export async function getCertificateByCode(req: AuthenticatedRequest, res: Response) {
  try {
    const { code } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      include: {
        student: {
          select: {
            fullName: true,
            university: true,
            major: true,
          },
        },
        project: {
          select: {
            title: true,
            requiredSkillTags: true,
            durationWeeks: true,
          },
        },
      },
    });

    if (!certificate) {
      return sendError(res, 'Certificate not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, mapCertificate(certificate));
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch certificate', 500, 'SERVER_ERROR');
  }
}

export async function getStudentCertificates(req: AuthenticatedRequest, res: Response) {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return sendError(res, 'Student ID is required', 400, 'VALIDATION_ERROR');
    }

    const certificates = await prisma.certificate.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            fullName: true,
            university: true,
            major: true,
          },
        },
        project: {
          select: {
            title: true,
            requiredSkillTags: true,
            durationWeeks: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return sendSuccess(res, certificates.map(mapCertificate));
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch certificates', 500, 'SERVER_ERROR');
  }
}
