"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateByCode = getCertificateByCode;
const prisma_1 = require("../../config/prisma");
const response_1 = require("../../utils/response");
async function getCertificateByCode(req, res) {
    try {
        const { code } = req.params;
        const certificate = await prisma_1.prisma.certificate.findUnique({
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
            return (0, response_1.sendError)(res, 'Certificate not found', 404, 'NOT_FOUND');
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
        return (0, response_1.sendSuccess)(res, responseData);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to fetch certificate', 500, 'SERVER_ERROR');
    }
}
