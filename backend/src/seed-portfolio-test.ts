import { PrismaClient, ProjectStatus, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedPortfolioTest() {
  console.log('🌱 Seed data for testing Verified Portfolio & Student Profile...');

  // 1. Cleanup old test data
  const testEmails = ['portfolio_student@example.com', 'portfolio_sme@example.com'];
  const usersToDelete = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    include: { studentProfile: true, smeProfile: true }
  });
  const studentIds = usersToDelete.map(u => u.studentProfile?.id).filter(Boolean) as string[];
  const smeIds = usersToDelete.map(u => u.smeProfile?.id).filter(Boolean) as string[];

  await prisma.verifiedPortfolioEntry.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.certificate.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.application.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.milestone.deleteMany({ where: { project: { smeId: { in: smeIds } } } });
  await prisma.project.deleteMany({ where: { smeId: { in: smeIds } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  // 2. Create student account & profile
  const studentPasswordHash = await bcrypt.hash('Password123!', 10);
  const studentUser = await prisma.user.create({
    data: {
      email: 'portfolio_student@example.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          fullName: 'Alex Portfolio Tester',
          university: 'University of Science (HCMUS)',
          major: 'Software Engineering',
          year: 4,
          skills: {
            expert: ['React', 'TypeScript', 'Node.js'],
            proficient: ['Tailwind CSS', 'PostgreSQL'],
            familiar: ['Figma', 'Docker'],
            githubUrl: 'https://github.com/alex-portfolio-dev',
            linkedInUrl: 'https://linkedin.com/in/alex-portfolio-demo'
          },
        },
      },
    },
    include: { studentProfile: true },
  });
  const studentId = studentUser.studentProfile!.id;

  // 3. Create SME account & profile
  const smePasswordHash = await bcrypt.hash('Password123!', 10);
  const smeUser = await prisma.user.create({
    data: {
      email: 'portfolio_sme@example.com',
      passwordHash: smePasswordHash,
      role: 'SME',
      smeProfile: {
        create: {
          companyName: 'Artisan Dev Studio',
          industry: 'Software Development',
        },
      },
    },
    include: { smeProfile: true },
  });
  const smeId = smeUser.smeProfile!.id;

  // 4. Find category tag
  const categoryTag = await prisma.tag.findFirst({
    where: { type: 'CATEGORY', isActive: true },
  });
  if (!categoryTag) {
    throw new Error('Database is missing CATEGORY tags. Please run main seeds first.');
  }

  // 5. Create projects: 2 Completed (for Portfolio & Certificates), 1 Active (for Workspace Dropdown)
  const dateAgo = new Date();
  dateAgo.setDate(dateAgo.getDate() - 15);

  // Project A (Completed)
  const projectA = await prisma.project.create({
    data: {
      smeId,
      title: 'Saigon Craft Beer — E-Commerce UI',
      description: 'Design and custom implementation of theme sections for craft brewery brand.',
      categoryTagId: categoryTag.id,
      requiredSkillTags: ['React', 'TypeScript', 'Figma'],
      budget: 8000000,
      durationWeeks: 3,
      deadline: dateAgo,
      status: ProjectStatus.COMPLETED,
      acceptedAt: dateAgo,
    }
  });

  // Project B (Completed)
  const projectB = await prisma.project.create({
    data: {
      smeId,
      title: 'EcoPack Packaging Identity & Web Copy',
      description: 'Copywriting and branding assets creation for eco-friendly packaging company.',
      categoryTagId: categoryTag.id,
      requiredSkillTags: ['TypeScript', 'Node.js', 'PostgreSQL'],
      budget: 5000000,
      durationWeeks: 2,
      deadline: dateAgo,
      status: ProjectStatus.COMPLETED,
      acceptedAt: dateAgo,
    }
  });

  // Project C (In Progress - for Workspace Dropdown)
  const projectC = await prisma.project.create({
    data: {
      smeId,
      title: 'Real-time Analytics Dashboard Integration',
      description: 'Building socket connections and real-time dashboard UI.',
      categoryTagId: categoryTag.id,
      requiredSkillTags: ['React', 'TypeScript', 'Node.js'],
      budget: 12000000,
      durationWeeks: 4,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: ProjectStatus.IN_PROGRESS,
    }
  });

  // 6. Create MATCHED application for Project C (so it shows in workspace dropdown)
  await prisma.application.create({
    data: {
      projectId: projectC.id,
      studentId,
      status: ApplicationStatus.ACCEPTED,
    }
  });

  // 7. Seed verified portfolio entries (linked to Project A and B)
  await prisma.verifiedPortfolioEntry.create({
    data: {
      studentId,
      projectId: projectA.id,
      projectTitle: projectA.title,
      smeName: 'Artisan Dev Studio',
      studentRole: 'Lead Frontend Developer',
      durationWeeks: projectA.durationWeeks,
      skillsApplied: ['React', 'TypeScript', 'Figma'],
      deliverableUrl: 'https://github.com/alex-portfolio-dev/beer-ecommerce',
      isVerified: true,
      completedAt: dateAgo,
    }
  });

  await prisma.verifiedPortfolioEntry.create({
    data: {
      studentId,
      projectId: projectB.id,
      projectTitle: projectB.title,
      smeName: 'Artisan Dev Studio',
      studentRole: 'Branding & Copy Contributor',
      durationWeeks: projectB.durationWeeks,
      skillsApplied: ['TypeScript', 'Node.js', 'PostgreSQL'],
      deliverableUrl: 'https://github.com/alex-portfolio-dev/ecopack-branding',
      isVerified: true,
      completedAt: dateAgo,
    }
  });

  // 8. Seed certificates (linked to Project A and B)
  await prisma.certificate.create({
    data: {
      studentId,
      projectId: projectA.id,
      verificationCode: 'SKILLBRIDGE-VERIFIED-10022',
      studentName: 'Alex Portfolio Tester',
      projectTitle: projectA.title,
      smeName: 'Artisan Dev Studio',
      issuedAt: dateAgo,
    }
  });

  await prisma.certificate.create({
    data: {
      studentId,
      projectId: projectB.id,
      verificationCode: 'SKILLBRIDGE-VERIFIED-30044',
      studentName: 'Alex Portfolio Tester',
      projectTitle: projectB.title,
      smeName: 'Artisan Dev Studio',
      issuedAt: dateAgo,
    }
  });

  console.log('\n======================================================');
  console.log('🎉 PORTFOLIO & PROFILE TEST DATA SEEDED SUCCESSFULLY!');
  console.log('------------------------------------------------------');
  console.log('Tài khoản chạy thử nghiệm:');
  console.log('1. Sinh viên (STUDENT):');
  console.log('   - Email: portfolio_student@example.com');
  console.log('   - Mật khẩu: Password123!');
  console.log('2. Doanh nghiệp (SME):');
  console.log('   - Email: portfolio_sme@example.com');
  console.log('   - Mật khẩu: Password123!');
  console.log('======================================================\n');
  
  process.exit(0);
}

seedPortfolioTest().catch((err) => {
  console.error('❌ Lỗi khởi tạo dữ liệu portfolio:', err);
  process.exit(1);
});
