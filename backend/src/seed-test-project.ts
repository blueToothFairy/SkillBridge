import { PrismaClient, ProjectStatus, ApplicationStatus, MilestoneStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestProject() {
  console.log('🌱 Đang khởi tạo dữ liệu chạy thử nghiệm cột mốc...');

  // 1. Dọn dẹp dữ liệu cũ
  const testEmails = ['mile_student@example.com', 'mile_sme@example.com'];
  const usersToDelete = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    include: { studentProfile: true, smeProfile: true }
  });
  const studentIds = usersToDelete.map(u => u.studentProfile?.id).filter(Boolean) as string[];
  const smeIds = usersToDelete.map(u => u.smeProfile?.id).filter(Boolean) as string[];

  await prisma.application.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.milestone.deleteMany({ where: { project: { smeId: { in: smeIds } } } });
  await prisma.project.deleteMany({ where: { smeId: { in: smeIds } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  // 2. Tạo tài khoản & profile sinh viên
  const studentPasswordHash = await bcrypt.hash('Password123!', 10);
  const studentUser = await prisma.user.create({
    data: {
      email: 'mile_student@example.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      studentProfile: {
        create: {
          fullName: 'Nguyễn Văn Sinh Viên',
          university: 'Đại học Bách Khoa',
          major: 'Khoa học Máy tính',
          year: 3,
          skills: ['React', 'Node.js', 'Figma'],
        },
      },
    },
    include: { studentProfile: true },
  });

  // 3. Tạo tài khoản & profile SME
  const smePasswordHash = await bcrypt.hash('Password123!', 10);
  const smeUser = await prisma.user.create({
    data: {
      email: 'mile_sme@example.com',
      passwordHash: smePasswordHash,
      role: 'SME',
      smeProfile: {
        create: {
          companyName: 'Công ty Công nghệ Startup X',
          industry: 'Phần mềm',
        },
      },
    },
    include: { smeProfile: true },
  });

  // 4. Tìm category tag
  const categoryTag = await prisma.tag.findFirst({
    where: { type: 'CATEGORY', isActive: true },
  });
  if (!categoryTag) {
    throw new Error('Database thiếu dữ liệu tag CATEGORY. Hãy chạy seed chính trước.');
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 9);

  // 5. Tạo dự án kèm Milestones lồng nhau
  const project = await prisma.project.create({
    data: {
      smeId: smeUser.smeProfile!.id,
      title: 'Xây dựng Mobile App quản lý chi tiêu cá nhân',
      description: 'Dự án thực tế xây dựng ứng dụng di động Flutter/React Native.',
      categoryTagId: categoryTag.id,
      requiredSkillTags: ['React', 'Figma'],
      budget: 6000000,
      durationWeeks: 4,
      deadline: nextWeek,
      status: ProjectStatus.IN_PROGRESS,
      milestones: {
        create: [
          {
            title: 'Cột mốc 1: Thiết kế Wireframe & UI trên Figma',
            description: 'Bàn giao file link thiết kế Figma hoàn thiện cho 5 màn hình chính.',
            deadline: tomorrow,
            orderIndex: 1,
            status: MilestoneStatus.PENDING,
            amountVnd: 2000000,
          },
          {
            title: 'Cột mốc 2: Hoàn thiện Source Code & Deploy Demo',
            description: 'Bàn giao link GitHub chứa mã nguồn hoạt động được.',
            deadline: nextWeek,
            orderIndex: 2,
            status: MilestoneStatus.PENDING,
            amountVnd: 4000000,
          },
        ],
      },
    },
  });

  // 6. Tạo khớp nối ứng tuyển (MATCHED)
  await prisma.application.create({
    data: {
      projectId: project.id,
      studentId: studentUser.studentProfile!.id,
      status: ApplicationStatus.ACCEPTED,
    },
  });

  console.log('\n======================================================');
  console.log('🎉 KHỞI TẠO DỮ LIỆU THỬ NGHIỆM THÀNH CÔNG!');
  console.log('------------------------------------------------------');
  console.log(`- Mã dự án (ProjectId): ${project.id}`);
  console.log(`- Link quản lý cột mốc: http://localhost:3000/projects/${project.id}/milestones`);
  console.log('------------------------------------------------------');
  console.log('Tài khoản đăng nhập:');
  console.log('1. Sinh viên: mile_student@example.com / Password123!');
  console.log('2. Doanh nghiệp (SME): mile_sme@example.com / Password123!');
  console.log('======================================================\n');
  
  process.exit(0);
}

seedTestProject().catch((err) => {
  console.error('❌ Lỗi khởi tạo:', err);
  process.exit(1);
});
