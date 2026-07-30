import supertest from 'supertest';
import app from '../../backend/src/app';
import { prisma } from '../../backend/src/config/prisma';
import { generateToken } from '../../backend/src/utils/jwt';

async function runDomainTests() {
  console.log('🧪 Starting Domain Testing (EP + BVA) Integration Tests for SkillBridge...');
  const request = supertest(app);
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      failedCount++;
      console.error(`❌ [FAIL] ${message}`);
    } else {
      passedCount++;
      console.log(`✅ [PASS] ${message}`);
    }
  }

  // Helper for positive cases (should succeed, status 2xx)
  function assertSuccess(status: number, message: string) {
    assert(status >= 200 && status < 300, `${message} (Returned: ${status})`);
  }

  // Helper for negative cases (should fail with validation error, status 400)
  function assertValidationError(status: number, message: string) {
    assert(status === 400, `${message} (Expected 400, Got: ${status})`);
  }

  const testEmails = [
    'domain_student@example.com',
    'domain_sme@example.com',
    'domain_admin@example.com',
    'domain_inc_student@example.com'
  ];

  try {
    // 1. Cleanup old test data
    console.log('\n🧹 Cleaning up old test data...');
    await prisma.application.deleteMany({
      where: { student: { user: { email: { in: testEmails } } } }
    });
    await prisma.verifiedPortfolioEntry.deleteMany({
      where: { project: { sme: { user: { email: { in: testEmails } } } } }
    });
    await prisma.certificate.deleteMany({
      where: { project: { sme: { user: { email: { in: testEmails } } } } }
    });
    await prisma.acceptanceReminder.deleteMany({
      where: { project: { sme: { user: { email: { in: testEmails } } } } }
    });
    await prisma.milestone.deleteMany({
      where: { project: { sme: { user: { email: { in: testEmails } } } } }
    });
    await prisma.project.deleteMany({
      where: { sme: { user: { email: { in: testEmails } } } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } }
    });
    console.log('Cleanup completed successfully.');

    // 2. Set up test users & profiles
    console.log('\n👤 Setting up test users & profiles...');

    // Register Student
    const sRes = await request.post('/api/auth/register').send({
      account: { email: 'domain_student@example.com', password: 'Password123!', role: 'STUDENT' },
      profile: { fullName: 'Domain Student', university: 'HCMUT', major: 'Software Engineering', year: 3, skills: { expert: ['React'] } }
    });
    assert(sRes.status === 201, 'Student registered successfully');
    const studentToken = sRes.body.data.token;
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { user: { email: 'domain_student@example.com' } }
    });

    // Register SME
    const smeRes = await request.post('/api/auth/register').send({
      account: { email: 'domain_sme@example.com', password: 'Password123!', role: 'SME' },
      profile: { companyName: 'Domain SME' }
    });
    assert(smeRes.status === 201, 'SME registered successfully');
    const smeToken = smeRes.body.data.token;

    // Get active tags from DB
    const categoryTag = await prisma.tag.findFirst({ where: { type: 'CATEGORY', isActive: true } });
    const skillTag = await prisma.tag.findFirst({ where: { type: 'SKILL', isActive: true } });
    if (!categoryTag || !skillTag) {
      throw new Error('Database is missing tags. Make sure the seed script has run.');
    }

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ==========================================
    // 3. PROJECT VALIDATION (POST /api/projects)
    // ==========================================
    console.log('\n--- 3. Testing Project Posting Boundary Values (SRS §5.1) ---');

    // TC-PROJ-VAL-01 (Negative): Title length too short (4 chars)
    const pTitleShort = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Proj', // 4 characters (Invalid: Min is 5)
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pTitleShort.status, 'TC-PROJ-VAL-01: Reject project title length < 5');

    // TC-PROJ-VAL-02 (Positive): Title length exactly 5 chars (Boundary)
    const pTitleMin = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Proj5', // 5 characters (Valid)
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertSuccess(pTitleMin.status, 'TC-PROJ-VAL-02: Accept project title length = 5');

    // TC-PROJ-VAL-03 (Negative): Title length too long (201 chars)
    const longTitle = 'a'.repeat(201);
    const pTitleLong = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: longTitle, // 201 characters (Invalid: Max is 200)
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pTitleLong.status, 'TC-PROJ-VAL-03: Reject project title length > 200');

    // TC-PROJ-VAL-04 (Negative): Description too short (19 chars)
    const pDescShort = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'Short description', // 17 characters (Invalid: Min is 20)
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pDescShort.status, 'TC-PROJ-VAL-04: Reject project description length < 20');

    // TC-PROJ-VAL-05 (Negative): Budget <= 0
    const pBudgetZero = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 0, // Invalid: Must be > 0
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 0 }]
      });
    assertValidationError(pBudgetZero.status, 'TC-PROJ-VAL-05: Reject project budget <= 0');

    // TC-PROJ-VAL-06 (Negative): Duration too short (0 weeks)
    const pDurZero = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 0, // Invalid: Min is 1 week
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pDurZero.status, 'TC-PROJ-VAL-06: Reject project duration < 1 week');

    // TC-PROJ-VAL-07 (Negative): Duration too long (9 weeks)
    const pDurNine = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 9, // Invalid: Max is 8 weeks
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pDurNine.status, 'TC-PROJ-VAL-07: Reject project duration > 8 weeks');

    // TC-PROJ-VAL-08 (Negative): Max applicants < 1
    const pAppZero = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 0, // Invalid: Must be 1-4
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pAppZero.status, 'TC-PROJ-VAL-08: Reject project maxApplicants < 1');

    // TC-PROJ-VAL-09 (Negative): Max applicants > 4
    const pAppFive = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 5, // Invalid: Must be 1-4
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pAppFive.status, 'TC-PROJ-VAL-09: Reject project maxApplicants > 4');

    // TC-PROJ-VAL-10 (Negative): Required skills count < 1 (Empty required skills)
    const pSkillsEmpty = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [], // Invalid: Must select 1-10 predefined tags
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pSkillsEmpty.status, 'TC-PROJ-VAL-10: Reject project required skills count < 1');

    // TC-PROJ-VAL-11 (Negative): Required skills count > 10
    const pSkillsEleven = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: Array(11).fill(skillTag.name), // Invalid: Max is 10
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assertValidationError(pSkillsEleven.status, 'TC-PROJ-VAL-11: Reject project required skills count > 10');

    // TC-PROJ-VAL-12 (Negative): Milestones list count = 0
    const pMilesEmpty = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [] // Invalid: At least 1 milestone is required
      });
    assertValidationError(pMilesEmpty.status, 'TC-PROJ-VAL-12: Reject project milestones count < 1');

    // TC-PROJ-VAL-13 (Negative): Milestones list count > 10
    const elevenMilestones = Array(11).fill(null).map((_, idx) => ({
      title: `M${idx}`,
      description: 'Long description of milestone',
      deadline: tomorrow,
      amountVnd: 100000
    }));
    const pMilesEleven = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1100000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: elevenMilestones // Invalid: At most 10 milestones
      });
    assertValidationError(pMilesEleven.status, 'TC-PROJ-VAL-13: Reject project milestones count > 10');

    // TC-PROJ-VAL-14 (Negative): Deadline in the past
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pDeadlinePast = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Project Title',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: yesterday, // Invalid: Must be in the future
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: yesterday, amountVnd: 1000000 }]
      });
    assertValidationError(pDeadlinePast.status, 'TC-PROJ-VAL-14: Reject project deadline in the past');

    // ===============================================
    // 4. STUDENT PROFILE VALIDATION (PATCH /api/auth/profile)
    // ===============================================
    console.log('\n--- 4. Testing Student Profile Boundary Values (SRS §5.4) ---');

    // TC-PROF-VAL-01 (Negative): Full Name too short (1 char)
    const profNameShort = await request
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ fullName: 'A' }); // 1 character (Invalid: Min is 2)
    assertValidationError(profNameShort.status, 'TC-PROF-VAL-01: Reject student fullName length < 2');

    // TC-PROF-VAL-02 (Negative): Full Name too long (101 chars)
    const profNameLong = await request
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ fullName: 'A'.repeat(101) }); // 101 characters (Invalid: Max is 100)
    assertValidationError(profNameLong.status, 'TC-PROF-VAL-02: Reject student fullName length > 100');

    // TC-PROF-VAL-03 (Negative): Academic Year < 1
    const profYearZero = await request
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ year: 0 }); // Invalid: Must be 1-6
    assertValidationError(profYearZero.status, 'TC-PROF-VAL-03: Reject student academic year < 1');

    // TC-PROF-VAL-04 (Negative): Academic Year > 6
    const profYearSeven = await request
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ year: 7 }); // Invalid: Must be 1-6
    assertValidationError(profYearSeven.status, 'TC-PROF-VAL-04: Reject student academic year > 6');

    // TC-PROF-VAL-05 (Negative): Skills tags count < 1
    const profSkillsEmpty = await request
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ skills: { expert: [], proficient: [], familiar: [] } }); // Invalid: Min is 1 tag
    assertValidationError(profSkillsEmpty.status, 'TC-PROF-VAL-05: Reject student profile with skills count < 1');

    // TC-PROF-VAL-06 (Negative): Skills tags count > 15
    const profSkillsSixteen = await request
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        skills: {
          expert: Array(6).fill(skillTag.name),
          proficient: Array(5).fill(skillTag.name),
          familiar: Array(5).fill(skillTag.name) // total 16 (Invalid: Max is 15)
        }
      });
    assertValidationError(profSkillsSixteen.status, 'TC-PROF-VAL-06: Reject student profile with skills count > 15');

    // ==========================================
    // 5. APPLICATION VALIDATION (POST /api/applications)
    // ==========================================
    console.log('\n--- 5. Testing Application Boundary Values (SRS §5.2) ---');

    // Create a valid project to apply to
    const createProjRes = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Valid Base Project',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    assert(createProjRes.status === 201, 'Base project created successfully');
    const validProjectId = createProjRes.body.data.id;

    // Approve the project to set it to OPEN
    const adminUser = await prisma.user.create({
      data: { email: 'domain_admin@example.com', passwordHash: 'dummy', role: 'ADMIN' }
    });
    const adminToken = generateToken({ userId: adminUser.id, email: adminUser.email, role: 'ADMIN' });
    
    await request
      .patch(`/api/projects/${validProjectId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE' });

    // TC-APP-VAL-01 (Negative): Cover message length > 2000 chars
    const appCoverLong = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        projectId: validProjectId,
        coverMessage: 'A'.repeat(2001) // Invalid: Max is 2000
      });
    assertValidationError(appCoverLong.status, 'TC-APP-VAL-01: Reject application cover message > 2000 chars');

    // TC-APP-VAL-02 (Negative): Student Profile incomplete (Missing year / name etc)
    // Register a student with incomplete profile directly in DB to bypass register validators
    const incUser = await prisma.user.create({
      data: { email: 'domain_inc_student@example.com', passwordHash: 'dummy', role: 'STUDENT' }
    });
    // Create incomplete student profile record in DB
    await prisma.studentProfile.create({
      data: {
        userId: incUser.id,
        fullName: '', // empty name (Incomplete)
        university: '', // empty university
        major: '', // empty major
        year: 0,
        skills: {}
      }
    });
    const incStudentToken = generateToken({ userId: incUser.id, email: incUser.email, role: 'STUDENT' });

    const appProfileInc = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${incStudentToken}`)
      .send({
        projectId: validProjectId,
        coverMessage: 'Valid cover message'
      });
    assertValidationError(appProfileInc.status, 'TC-APP-VAL-02: Reject application when student profile is incomplete');

    // TC-APP-VAL-03 (Negative): Apply to project that is NOT OPEN (e.g. DRAFT)
    const draftProjRes = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${smeToken}`)
      .send({
        title: 'Draft Project Test',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        milestones: [{ title: 'Milestone 1', description: 'Description of milestone one', deadline: tomorrow, amountVnd: 1000000 }]
      });
    const draftProjectId = draftProjRes.body.data.id; // status: UNDER_REVIEW (Not OPEN)

    const appProjectNotOpen = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        projectId: draftProjectId,
        coverMessage: 'Valid cover message'
      });
    assertValidationError(appProjectNotOpen.status, 'TC-APP-VAL-03: Reject application when project status is not OPEN');

    // ================================================
    // 6. MILESTONE VALIDATION (PATCH /api/milestones/:id/submit)
    // ================================================
    console.log('\n--- 6. Testing Milestone Submission Boundary Values (SRS §5.3) ---');

    // Get the milestone ID of the valid project
    const milestones = await prisma.milestone.findMany({ where: { projectId: validProjectId } });
    const milestoneId = milestones[0].id;

    // Transition project to IN_PROGRESS so student can submit milestone deliverables
    // Simulating match and IN_PROGRESS state
    await prisma.application.upsert({
      where: {
        projectId_studentId: {
          projectId: validProjectId,
          studentId: studentProfile!.id
        }
      },
      update: {
        status: 'ACCEPTED'
      },
      create: {
        projectId: validProjectId,
        studentId: studentProfile!.id,
        status: 'ACCEPTED'
      }
    });

    await prisma.project.update({
      where: { id: validProjectId },
      data: {
        status: 'IN_PROGRESS',
        escrowStatus: 'HELD'
      }
    });
    // Set milestone status to IN_PROGRESS
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'IN_PROGRESS' }
    });

    // TC-MILE-VAL-01 (Negative): Deliverable URL empty on submit
    const mileSubmitEmpty = await request
      .patch(`/api/milestones/${milestoneId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ deliverableUrl: '' });
    assertValidationError(mileSubmitEmpty.status, 'TC-MILE-VAL-01: Reject milestone submission with empty URL');

    // TC-MILE-VAL-02 (Negative): Deliverable URL format invalid
    const mileSubmitInvalidUrl = await request
      .patch(`/api/milestones/${milestoneId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ deliverableUrl: 'not_a_valid_url' });
    assertValidationError(mileSubmitInvalidUrl.status, 'TC-MILE-VAL-02: Reject milestone submission with invalid URL format');

    // TC-MILE-VAL-03 (Positive): Deliverable URL format valid (Boundary)
    const mileSubmitValidUrl = await request
      .patch(`/api/milestones/${milestoneId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ deliverableUrl: 'https://github.com/skillbridge/project' });
    assertSuccess(mileSubmitValidUrl.status, 'TC-MILE-VAL-03: Accept milestone submission with valid URL format');

    // Clean up created admin & incomplete student users
    await prisma.application.deleteMany({
      where: { student: { user: { email: { in: testEmails } } } }
    });
    await prisma.milestone.deleteMany({
      where: { project: { sme: { user: { email: { in: testEmails } } } } }
    });
    await prisma.project.deleteMany({
      where: { sme: { user: { email: { in: testEmails } } } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } }
    });

  } catch (error: any) {
    console.error('💥 Error running domain tests:', error);
  } finally {
    console.log('\n======================================================');
    console.log(`📊 Domain Testing Results: Passed: ${passedCount}, Failed: ${failedCount}`);
    console.log('======================================================\n');
  }
}

runDomainTests().catch((e) => console.error(e));
