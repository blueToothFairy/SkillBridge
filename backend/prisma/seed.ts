import { PrismaClient, TagType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Seed Categories
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

  // Seed Skills
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

  // Seed Users
  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed Admin User
  await prisma.user.upsert({
    where: { email: 'admin@skillbridge.com' },
    update: {},
    create: {
      email: 'admin@skillbridge.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // Seed SME User
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

  const smeProfileId = smeUser.smeProfile?.id;
  const webCategory = await prisma.tag.findUnique({ where: { name: 'Web Development' } });
  const uiCategory = await prisma.tag.findUnique({ where: { name: 'UI/UX Design' } });

  if (smeProfileId && webCategory && uiCategory) {
    // Seed Sample Projects
    const projects = [
      {
        smeId: smeProfileId,
        title: 'Xây dựng Website E-commerce cho Thương hiệu Thời trang',
        description: 'Phát triển giao diện frontend với React, Tailwind CSS và kết nối RESTful API Node.js cho cửa hàng bán hàng trực tuyến.',
        categoryTagId: webCategory.id,
        requiredSkillTags: ['React', 'Node.js', 'Tailwind CSS'],
        budget: 15000000,
        durationWeeks: 4,
        maxApplicants: 5,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        smeId: smeProfileId,
        title: 'Thiết kế Giao diện App Di động Quản lý Tài chính',
        description: 'Thiết kế Wireframe, UI Mockup & Prototype trên Figma cho ứng dụng quản lý chi tiêu cá nhân.',
        categoryTagId: uiCategory.id,
        requiredSkillTags: ['Figma', 'UI/UX Design'],
        budget: 8000000,
        durationWeeks: 2,
        maxApplicants: 3,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const p of projects) {
      await prisma.project.create({
        data: p,
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
