import { PrismaClient, TagType, UserRole, ProjectStatus, EscrowStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const categories = [
    { name: 'Web Development', type: TagType.CATEGORY },
    { name: 'Mobile App Development', type: TagType.CATEGORY },
    { name: 'UI/UX Design', type: TagType.CATEGORY },
    { name: 'Data Science & AI', type: TagType.CATEGORY },
    { name: 'Digital Marketing', type: TagType.CATEGORY },
  ];

  for (const cat of categories) {
    await prisma.tag.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const skills = [
    { name: 'React', type: TagType.SKILL },
    { name: 'Node.js', type: TagType.SKILL },
    { name: 'TypeScript', type: TagType.SKILL },
    { name: 'Python', type: TagType.SKILL },
    { name: 'Figma', type: TagType.SKILL },
    { name: 'Flutter', type: TagType.SKILL },
    { name: 'PostgreSQL', type: TagType.SKILL },
    { name: 'Tailwind CSS', type: TagType.SKILL },
  ];

  for (const skill of skills) {
    await prisma.tag.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@skillbridge.com' },
    update: {},
    create: {
      email: 'admin@skillbridge.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const smeUser = await prisma.user.upsert({
    where: { email: 'techcorp@sme.com' },
    update: {},
    create: {
      email: 'techcorp@sme.com',
      passwordHash,
      role: UserRole.SME,
      smeProfile: {
        create: {
          companyName: 'TechCorp Innovations',
          industry: 'Information Technology',
          website: 'https://techcorp.example.com',
        },
      },
    },
    include: { smeProfile: true },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'an.nguyen@student.edu.vn' },
    update: {},
    create: {
      email: 'an.nguyen@student.edu.vn',
      passwordHash,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          fullName: 'Nguyen Van An',
          university: 'UEH',
          major: 'Software Engineering',
          year: 3,
          skills: {
            expert: ['React', 'TypeScript'],
            proficient: ['Node.js', 'Tailwind CSS'],
            familiar: ['PostgreSQL'],
          },
        },
      },
    },
    include: { studentProfile: true },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'binh.tran@student.edu.vn' },
    update: {},
    create: {
      email: 'binh.tran@student.edu.vn',
      passwordHash,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          fullName: 'Tran Thi Binh',
          university: 'UIT',
          major: 'UI/UX Design',
          year: 2,
          skills: {
            expert: ['Figma'],
            proficient: ['Tailwind CSS'],
            familiar: ['React'],
          },
        },
      },
    },
    include: { studentProfile: true },
  });

  const smeProfileId = smeUser.smeProfile?.id;
  const webCategory = await prisma.tag.findUnique({ where: { name: 'Web Development' } });
  const uiCategory = await prisma.tag.findUnique({ where: { name: 'UI/UX Design' } });

  if (smeProfileId && webCategory && uiCategory) {
    const ensureMilestones = async (
      projectId: string,
      items: { title: string; description: string; days: number; amountVnd: number }[]
    ) => {
      const count = await prisma.milestone.count({ where: { projectId } });
      if (count > 0) return;
      await prisma.milestone.createMany({
        data: items.map((m, idx) => ({
          projectId,
          title: m.title,
          description: m.description,
          deadline: new Date(Date.now() + m.days * 24 * 60 * 60 * 1000),
          orderIndex: idx + 1,
          amountVnd: m.amountVnd,
        })),
      });
    };

    const existingOpen = await prisma.project.findFirst({
      where: {
        smeId: smeProfileId,
        title: 'Xây dựng Website E-commerce cho Thương hiệu Thời trang',
      },
    });

    let ecommerceId = existingOpen?.id;

    if (!existingOpen) {
      const project = await prisma.project.create({
        data: {
          smeId: smeProfileId,
          title: 'Xây dựng Website E-commerce cho Thương hiệu Thời trang',
          description:
            'Phát triển giao diện frontend với React, Tailwind CSS và kết nối RESTful API Node.js cho cửa hàng bán hàng trực tuyến.',
          categoryTagId: webCategory.id,
          requiredSkillTags: ['React', 'Node.js', 'Tailwind CSS'],
          budget: 15000000,
          durationWeeks: 4,
          maxApplicants: 2,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: ProjectStatus.OPEN,
          escrowStatus: EscrowStatus.PENDING,
        },
      });
      ecommerceId = project.id;
    }

    if (ecommerceId) {
      await ensureMilestones(ecommerceId, [
        {
          title: 'Wireframe & UI Kit',
          description: 'Hoàn thành wireframe trang chủ, listing, cart trên Figma/HTML.',
          days: 10,
          amountVnd: 5000000,
        },
        {
          title: 'Frontend MVP',
          description: 'Implement React pages + Tailwind, responsive mobile.',
          days: 20,
          amountVnd: 5000000,
        },
        {
          title: 'API Integration',
          description: 'Kết nối Node.js API, checkout flow demo.',
          days: 28,
          amountVnd: 5000000,
        },
      ]);

      if (studentUser.studentProfile) {
        await prisma.application.upsert({
          where: {
            projectId_studentId: {
              projectId: ecommerceId,
              studentId: studentUser.studentProfile.id,
            },
          },
          update: {},
          create: {
            projectId: ecommerceId,
            studentId: studentUser.studentProfile.id,
            coverMessage:
              'Em có kinh nghiệm React/TypeScript và đã làm 2 dự án e-commerce nhỏ. Mong được đồng hành cùng TechCorp.',
          },
        });
      }
      if (student2.studentProfile) {
        await prisma.application.upsert({
          where: {
            projectId_studentId: {
              projectId: ecommerceId,
              studentId: student2.studentProfile.id,
            },
          },
          update: {},
          create: {
            projectId: ecommerceId,
            studentId: student2.studentProfile.id,
            coverMessage: 'Em mạnh về UI và Tailwind, sẵn sàng hỗ trợ frontend polish.',
          },
        });
      }
    }

    const existingUi = await prisma.project.findFirst({
      where: {
        smeId: smeProfileId,
        title: 'Thiết kế Giao diện App Di động Quản lý Tài chính',
      },
    });

    let uiId = existingUi?.id;
    if (!existingUi) {
      const project = await prisma.project.create({
        data: {
          smeId: smeProfileId,
          title: 'Thiết kế Giao diện App Di động Quản lý Tài chính',
          description:
            'Thiết kế Wireframe, UI Mockup & Prototype trên Figma cho ứng dụng quản lý chi tiêu cá nhân.',
          categoryTagId: uiCategory.id,
          requiredSkillTags: ['Figma', 'UI/UX Design'],
          budget: 8000000,
          durationWeeks: 2,
          maxApplicants: 3,
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: ProjectStatus.OPEN,
          escrowStatus: EscrowStatus.PENDING,
        },
      });
      uiId = project.id;
    }

    if (uiId) {
      await ensureMilestones(uiId, [
        {
          title: 'User Flow & Wireframe',
          description: 'Vẽ user flow và low-fi wireframes cho 5 màn hình chính.',
          days: 7,
          amountVnd: 3000000,
        },
        {
          title: 'Hi-fi Prototype',
          description: 'Prototype Figma có tương tác và design system cơ bản.',
          days: 14,
          amountVnd: 5000000,
        },
      ]);
    }
  }

  console.log('✅ Seeding completed successfully!');
  console.log('Demo accounts (password: password123):');
  console.log('  admin@skillbridge.com');
  console.log('  techcorp@sme.com');
  console.log('  an.nguyen@student.edu.vn');
  console.log('  binh.tran@student.edu.vn');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
