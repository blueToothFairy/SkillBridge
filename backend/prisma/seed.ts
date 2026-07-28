import { PrismaClient, TagType, UserRole, ProjectStatus, EscrowStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type StudentSeed = {
  email: string;
  fullName: string;
  university: string;
  major: string;
  year: number;
  skills: {
    expert: string[];
    proficient: string[];
    familiar: string[];
  };
};

type ProjectSeed = {
  title: string;
  description: string;
  categoryName: string;
  requiredSkillTags: string[];
  budget: number;
  durationWeeks: number;
  maxApplicants: number;
  deadlineDays: number;
  milestones: { title: string; description: string; days: number; amountVnd: number }[];
  applicantEmails?: string[];
};

async function upsertStudent(passwordHash: string, seed: StudentSeed) {
  return prisma.user.upsert({
    where: { email: seed.email },
    update: {
      studentProfile: {
        upsert: {
          update: {
            fullName: seed.fullName,
            university: seed.university,
            major: seed.major,
            year: seed.year,
            skills: seed.skills,
          },
          create: {
            fullName: seed.fullName,
            university: seed.university,
            major: seed.major,
            year: seed.year,
            skills: seed.skills,
          },
        },
      },
    },
    create: {
      email: seed.email,
      passwordHash,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          fullName: seed.fullName,
          university: seed.university,
          major: seed.major,
          year: seed.year,
          skills: seed.skills,
        },
      },
    },
    include: { studentProfile: true },
  });
}

async function upsertSme(
  passwordHash: string,
  seed: { email: string; companyName: string; industry: string; website: string }
) {
  return prisma.user.upsert({
    where: { email: seed.email },
    update: {
      smeProfile: {
        upsert: {
          update: {
            companyName: seed.companyName,
            industry: seed.industry,
            website: seed.website,
          },
          create: {
            companyName: seed.companyName,
            industry: seed.industry,
            website: seed.website,
          },
        },
      },
    },
    create: {
      email: seed.email,
      passwordHash,
      role: UserRole.SME,
      smeProfile: {
        create: {
          companyName: seed.companyName,
          industry: seed.industry,
          website: seed.website,
        },
      },
    },
    include: { smeProfile: true },
  });
}

async function ensureProject(smeId: string, seed: ProjectSeed, studentMap: Map<string, string>) {
  const category = await prisma.tag.findUnique({ where: { name: seed.categoryName } });
  if (!category) return;

  let project = await prisma.project.findFirst({
    where: {
      smeId,
      title: seed.title,
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        smeId,
        title: seed.title,
        description: seed.description,
        categoryTagId: category.id,
        requiredSkillTags: seed.requiredSkillTags,
        budget: seed.budget,
        durationWeeks: seed.durationWeeks,
        maxApplicants: seed.maxApplicants,
        deadline: new Date(Date.now() + seed.deadlineDays * 24 * 60 * 60 * 1000),
        status: ProjectStatus.OPEN,
        escrowStatus: EscrowStatus.PENDING,
      },
    });
  }

  const milestoneCount = await prisma.milestone.count({ where: { projectId: project.id } });
  if (milestoneCount === 0) {
    await prisma.milestone.createMany({
      data: seed.milestones.map((m, idx) => ({
        projectId: project!.id,
        title: m.title,
        description: m.description,
        deadline: new Date(Date.now() + m.days * 24 * 60 * 60 * 1000),
        orderIndex: idx + 1,
        amountVnd: m.amountVnd,
      })),
    });
  }

  for (const email of seed.applicantEmails || []) {
    const studentId = studentMap.get(email);
    if (!studentId) continue;
    await prisma.application.upsert({
      where: {
        projectId_studentId: {
          projectId: project.id,
          studentId,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        studentId,
        coverMessage: `Application seed for ${seed.title}`,
      },
    });
  }
}

async function main() {
  console.log('?? Starting database seeding...');

  const categories = [
    { name: 'Web Development', type: TagType.CATEGORY },
    { name: 'Mobile App Development', type: TagType.CATEGORY },
    { name: 'UI/UX Design', type: TagType.CATEGORY },
    { name: 'Data Science & AI', type: TagType.CATEGORY },
    { name: 'Digital Marketing', type: TagType.CATEGORY },
  ];

  for (const cat of categories) {
    await prisma.tag.upsert({ where: { name: cat.name }, update: {}, create: cat });
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
    { name: 'SEO', type: TagType.SKILL },
    { name: 'Marketing', type: TagType.SKILL },
    { name: 'Content Writing', type: TagType.SKILL },
    { name: 'Data Analysis', type: TagType.SKILL },
  ];

  for (const skill of skills) {
    await prisma.tag.upsert({ where: { name: skill.name }, update: {}, create: skill });
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

  const smeSeeds = [
    {
      email: 'techcorp@sme.com',
      companyName: 'TechCorp Innovations',
      industry: 'Information Technology',
      website: 'https://techcorp.example.com',
    },
    {
      email: 'folio@sme.com',
      companyName: 'Folio Creative',
      industry: 'Branding & Design',
      website: 'https://folio.example.com',
    },
    {
      email: 'growth@sme.com',
      companyName: 'GrowthHub Digital',
      industry: 'Digital Marketing',
      website: 'https://growthhub.example.com',
    },
  ];

  const smeUsers = await Promise.all(smeSeeds.map((seed) => upsertSme(passwordHash, seed)));
  const smeMap = new Map(smeUsers.map((u) => [u.email, u.smeProfile!.id]));

  const studentSeeds: StudentSeed[] = [
    {
      email: 'an.nguyen@student.edu.vn',
      fullName: 'Nguyen Van An',
      university: 'UEH',
      major: 'Software Engineering',
      year: 3,
      skills: { expert: ['React', 'TypeScript'], proficient: ['Node.js', 'Tailwind CSS'], familiar: ['PostgreSQL'] },
    },
    {
      email: 'binh.tran@student.edu.vn',
      fullName: 'Tran Thi Binh',
      university: 'UIT',
      major: 'UI/UX Design',
      year: 2,
      skills: { expert: ['Figma'], proficient: ['Tailwind CSS'], familiar: ['React'] },
    },
    {
      email: 'chi.le@student.edu.vn',
      fullName: 'Le Minh Chi',
      university: 'HCMUS',
      major: 'Computer Science',
      year: 4,
      skills: { expert: ['Python'], proficient: ['Data Analysis', 'PostgreSQL'], familiar: ['React'] },
    },
    {
      email: 'duy.vo@student.edu.vn',
      fullName: 'Vo Hoang Duy',
      university: 'PTIT',
      major: 'Software Engineering',
      year: 3,
      skills: { expert: ['Node.js'], proficient: ['React', 'TypeScript'], familiar: ['PostgreSQL'] },
    },
    {
      email: 'ha.pham@student.edu.vn',
      fullName: 'Pham Thu Ha',
      university: 'RMIT',
      major: 'Digital Marketing',
      year: 2,
      skills: { expert: ['Marketing'], proficient: ['SEO', 'Content Writing'], familiar: ['Data Analysis'] },
    },
    {
      email: 'khanh.do@student.edu.vn',
      fullName: 'Do Khanh',
      university: 'UET',
      major: 'Mobile Development',
      year: 4,
      skills: { expert: ['Flutter'], proficient: ['UI/UX Design', 'Figma'], familiar: ['TypeScript'] },
    },
    {
      email: 'linh.ngo@student.edu.vn',
      fullName: 'Ngo Linh',
      university: 'FTU',
      major: 'Business Analytics',
      year: 3,
      skills: { expert: ['Data Analysis'], proficient: ['Python', 'Marketing'], familiar: ['SEO'] },
    },
    {
      email: 'minh.bui@student.edu.vn',
      fullName: 'Bui Duc Minh',
      university: 'BKU',
      major: 'Information Systems',
      year: 4,
      skills: { expert: ['PostgreSQL'], proficient: ['Node.js', 'TypeScript'], familiar: ['React'] },
    },
    {
      email: 'nhi.truong@student.edu.vn',
      fullName: 'Truong Bao Nhi',
      university: 'UEL',
      major: 'E-commerce',
      year: 2,
      skills: { expert: ['Content Writing'], proficient: ['Marketing', 'SEO'], familiar: ['Figma'] },
    },
    {
      email: 'phuc.nguyen@student.edu.vn',
      fullName: 'Nguyen Quang Phuc',
      university: 'VNU',
      major: 'Software Engineering',
      year: 3,
      skills: { expert: ['React'], proficient: ['Node.js', 'Tailwind CSS'], familiar: ['Python'] },
    },
  ];

  const studentUsers = await Promise.all(studentSeeds.map((seed) => upsertStudent(passwordHash, seed)));
  const studentMap = new Map(studentUsers.map((u) => [u.email, u.studentProfile!.id]));

  const projects: { smeEmail: string; data: ProjectSeed }[] = [
    {
      smeEmail: 'techcorp@sme.com',
      data: {
        title: 'Xây d?ng Website E-commerce cho Thuong hi?u Th?i trang',
        description: 'Phát tri?n giao di?n frontend v?i React, Tailwind CSS và k?t n?i RESTful API Node.js cho c?a hàng bán hàng tr?c tuy?n.',
        categoryName: 'Web Development',
        requiredSkillTags: ['React', 'Node.js', 'Tailwind CSS'],
        budget: 15000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadlineDays: 30,
        milestones: [
          { title: 'Wireframe & UI Kit', description: 'Hoàn thành wireframe trang ch?, listing, cart trên Figma/HTML.', days: 10, amountVnd: 5000000 },
          { title: 'Frontend MVP', description: 'Implement React pages + Tailwind, responsive mobile.', days: 20, amountVnd: 5000000 },
          { title: 'API Integration', description: 'K?t n?i Node.js API, checkout flow demo.', days: 28, amountVnd: 5000000 },
        ],
        applicantEmails: ['an.nguyen@student.edu.vn', 'duy.vo@student.edu.vn', 'phuc.nguyen@student.edu.vn'],
      },
    },
    {
      smeEmail: 'techcorp@sme.com',
      data: {
        title: 'Thi?t k? Giao di?n App Di d?ng Qu?n lý Tài chính',
        description: 'Thi?t k? Wireframe, UI Mockup & Prototype trên Figma cho ?ng d?ng qu?n lý chi tiêu cá nhân.',
        categoryName: 'UI/UX Design',
        requiredSkillTags: ['Figma', 'UI/UX Design'],
        budget: 8000000,
        durationWeeks: 2,
        maxApplicants: 3,
        deadlineDays: 15,
        milestones: [
          { title: 'User Flow & Wireframe', description: 'V? user flow và low-fi wireframes cho 5 màn hình chính.', days: 7, amountVnd: 3000000 },
          { title: 'Hi-fi Prototype', description: 'Prototype Figma có tuong tác và design system co b?n.', days: 14, amountVnd: 5000000 },
        ],
        applicantEmails: ['binh.tran@student.edu.vn', 'khanh.do@student.edu.vn'],
      },
    },
    {
      smeEmail: 'folio@sme.com',
      data: {
        title: 'Brand Identity Redesign cho quán cà phê specialty',
        description: 'Thi?t k? l?i h? th?ng nh?n di?n thuong hi?u, social assets và mini brand guideline cho SME F&B.',
        categoryName: 'UI/UX Design',
        requiredSkillTags: ['Figma', 'Content Writing'],
        budget: 9000000,
        durationWeeks: 3,
        maxApplicants: 2,
        deadlineDays: 21,
        milestones: [
          { title: 'Discovery Moodboard', description: 'Thu th?p reference, visual direction và moodboard.', days: 5, amountVnd: 3000000 },
          { title: 'Logo Concepts', description: 'Ð? xu?t 3 hu?ng logo và social avatar kit.', days: 12, amountVnd: 3000000 },
          { title: 'Brand Guideline', description: 'Hoàn thi?n guideline ng?n và file bàn giao.', days: 20, amountVnd: 3000000 },
        ],
        applicantEmails: ['binh.tran@student.edu.vn', 'nhi.truong@student.edu.vn'],
      },
    },
    {
      smeEmail: 'growth@sme.com',
      data: {
        title: 'SEO & Content Sprint cho landing page B2B',
        description: 'T?i uu SEO on-page và vi?t b? content cho chi?n d?ch tìm lead B2B.',
        categoryName: 'Digital Marketing',
        requiredSkillTags: ['SEO', 'Content Writing', 'Marketing'],
        budget: 7000000,
        durationWeeks: 2,
        maxApplicants: 3,
        deadlineDays: 18,
        milestones: [
          { title: 'Keyword Research', description: 'Nghiên c?u b? t? khóa uu tiên và content outline.', days: 6, amountVnd: 2500000 },
          { title: 'Landing Copy Draft', description: 'Vi?t draft full landing và meta SEO.', days: 11, amountVnd: 2000000 },
          { title: 'Optimization & Handover', description: 'Tinh ch?nh và bàn giao checklist theo dõi.', days: 17, amountVnd: 2500000 },
        ],
        applicantEmails: ['ha.pham@student.edu.vn', 'nhi.truong@student.edu.vn', 'linh.ngo@student.edu.vn'],
      },
    },
    {
      smeEmail: 'growth@sme.com',
      data: {
        title: 'Data Dashboard cho chi?n d?ch marketing da kênh',
        description: 'T?ng h?p d? li?u CSV campaign và d?ng dashboard hi?u qu? chi?n d?ch cho d?i growth.',
        categoryName: 'Data Science & AI',
        requiredSkillTags: ['Python', 'Data Analysis', 'PostgreSQL'],
        budget: 11000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadlineDays: 28,
        milestones: [
          { title: 'Data Cleaning', description: 'Chu?n hóa d? li?u ngu?n và mapping schema.', days: 7, amountVnd: 3000000 },
          { title: 'Dashboard MVP', description: 'D?ng dashboard ch? s? chính và b? l?c.', days: 18, amountVnd: 4000000 },
          { title: 'Insights Report', description: 'Vi?t insight report và bàn giao tài li?u s? d?ng.', days: 27, amountVnd: 4000000 },
        ],
        applicantEmails: ['chi.le@student.edu.vn', 'linh.ngo@student.edu.vn', 'minh.bui@student.edu.vn'],
      },
    },
  ];

  for (const item of projects) {
    const smeId = smeMap.get(item.smeEmail);
    if (!smeId) continue;
    await ensureProject(smeId, item.data, studentMap);
  }

  console.log('? Seeding completed successfully!');
  console.log('Demo accounts (password: password123):');
  console.log('  admin@skillbridge.com');
  for (const seed of smeSeeds) console.log(`  ${seed.email}`);
  for (const seed of studentSeeds) console.log(`  ${seed.email}`);
}

main()
  .catch((e) => {
    console.error('? Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
