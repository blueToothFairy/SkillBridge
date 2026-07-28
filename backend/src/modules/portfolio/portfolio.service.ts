import { prisma } from '../../config/prisma';

export async function getStudentProfileAndPortfolio(studentId: string) {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      certificates: true,
    },
  });

  if (!studentProfile) {
    return null;
  }

  const portfolioEntries = await prisma.verifiedPortfolioEntry.findMany({
    where: { studentId },
    orderBy: { completedAt: 'desc' },
  });

  // Merge verificationCode from corresponding Certificate
  const mappedPortfolio = portfolioEntries.map((entry) => {
    const cert = studentProfile.certificates.find((c) => c.projectId === entry.projectId);
    return {
      ...entry,
      verificationCode: cert ? cert.verificationCode : `SKILLBRIDGE-VERIFIED-${entry.id.substring(0, 5).toUpperCase()}`,
    };
  });

  const { certificates, ...profileOnly } = studentProfile as any;

  return {
    profile: profileOnly,
    portfolio: mappedPortfolio,
  };
}
