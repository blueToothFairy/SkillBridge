import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendError } from '../../utils/response';

export async function getCertificateByCode(req: Request, res: Response) {
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

    // Map database fields to the DigitalCertificate shape expected by frontend
    const responseData = {
      id: certificate.id,
      certificateNumber: certificate.verificationCode,
      studentName: certificate.studentName,
      university: certificate.student.university,
      projectTitle: certificate.projectTitle,
      smeCompany: certificate.smeName,
      issueDate: certificate.issuedAt.toISOString().split('T')[0],
      skillsVerified: certificate.project.requiredSkillTags || [],
      verificationCode: certificate.verificationCode,
    };

    return sendSuccess(res, responseData);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch certificate', 500, 'SERVER_ERROR');
  }
}

export async function getStudentCertificates(req: Request, res: Response) {
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

    const mappedCertificates = certificates.map((cert) => ({
      id: cert.id,
      certificateNumber: cert.verificationCode,
      studentName: cert.studentName,
      university: cert.student.university,
      projectTitle: cert.projectTitle,
      smeCompany: cert.smeName,
      issueDate: cert.issuedAt.toISOString().split('T')[0],
      skillsVerified: cert.project.requiredSkillTags || [],
      verificationCode: cert.verificationCode,
    }));

    return sendSuccess(res, mappedCertificates);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch certificates', 500, 'SERVER_ERROR');
  }
}
