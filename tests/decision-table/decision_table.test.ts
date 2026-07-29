import supertest from 'supertest';
import app from '../../backend/src/app';
import { prisma } from '../../backend/src/config/prisma';
import { generateToken } from '../../backend/src/utils/jwt';
import { ProjectStatus, MilestoneStatus, ApplicationStatus } from '@prisma/client';

async function runDecisionTableTests() {
  console.log('🧪 Starting Decision Table Authorization Integration Tests for SkillBridge...');
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

  function assertStatus(status: number, expected: number, message: string) {
    assert(status === expected, `${message} (Expected: ${expected}, Got: ${status})`);
  }

  const testEmails = [
    'dt_student_matched@example.com',
    'dt_student_unmatched@example.com',
    'dt_student_incomplete@example.com',
    'dt_sme_owner@example.com',
    'dt_sme_other@example.com',
    'dt_admin@example.com'
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

    // Matched Student (Complete Profile)
    const sMatchedRes = await request.post('/api/auth/register').send({
      account: { email: 'dt_student_matched@example.com', password: 'Password123!', role: 'STUDENT' },
      profile: { fullName: 'Matched Student', university: 'HCMUT', major: 'Software Engineering', year: 3, skills: { expert: ['React'] } }
    });
    assert(sMatchedRes.status === 201, 'Matched Student registered successfully');
    const matchedStudentToken = sMatchedRes.body.data.token;
    const matchedStudentProfile = await prisma.studentProfile.findFirst({
      where: { user: { email: 'dt_student_matched@example.com' } }
    });

    // Unmatched Student (Complete Profile)
    const sUnmatchedRes = await request.post('/api/auth/register').send({
      account: { email: 'dt_student_unmatched@example.com', password: 'Password123!', role: 'STUDENT' },
      profile: { fullName: 'Unmatched Student', university: 'HCMUS', major: 'Data Science', year: 4, skills: { expert: ['Python'] } }
    });
    assert(sUnmatchedRes.status === 201, 'Unmatched Student registered successfully');
    const unmatchedStudentToken = sUnmatchedRes.body.data.token;
    const unmatchedStudentProfile = await prisma.studentProfile.findFirst({
      where: { user: { email: 'dt_student_unmatched@example.com' } }
    });

    // Incomplete Student (registered but missing required profile fields: bio, fullName, university, etc. are empty/default or we bypass frontend)
    // To simulate incomplete profile on backend, we will create user and student profile directly in DB with empty fields.
    const incompleteUser = await prisma.user.create({
      data: {
        email: 'dt_student_incomplete@example.com',
        passwordHash: '$2b$10$vPxW.7g87r9/eGg8hW6xye.5Y2aF75iWJ.9eP6lHn9dD7f2g/G.2u',
        role: 'STUDENT'
      }
    });
    const incompleteStudentToken = generateToken({ userId: incompleteUser.id, email: incompleteUser.email, role: 'STUDENT' });
    const incompleteStudentProfile = await prisma.studentProfile.create({
      data: {
        userId: incompleteUser.id,
        fullName: '', // Incomplete
        university: '', // Incomplete
        major: '', // Incomplete
        year: 0, // Incomplete
        skills: [] // Incomplete
      }
    });
    console.log('Incomplete Student created in DB.');

    // SME Owner
    const smeOwnerRes = await request.post('/api/auth/register').send({
      account: { email: 'dt_sme_owner@example.com', password: 'Password123!', role: 'SME' },
      profile: { companyName: 'Owner SME Co' }
    });
    assert(smeOwnerRes.status === 201, 'SME Owner registered successfully');
    const smeOwnerToken = smeOwnerRes.body.data.token;
    const smeOwnerProfile = await prisma.smeProfile.findFirst({
      where: { user: { email: 'dt_sme_owner@example.com' } }
    });

    // SME Other
    const smeOtherRes = await request.post('/api/auth/register').send({
      account: { email: 'dt_sme_other@example.com', password: 'Password123!', role: 'SME' },
      profile: { companyName: 'Other SME Co' }
    });
    assert(smeOtherRes.status === 201, 'SME Other registered successfully');
    const smeOtherToken = smeOtherRes.body.data.token;

    // Admin
    const adminUser = await prisma.user.create({
      data: {
        email: 'dt_admin@example.com',
        passwordHash: '$2b$10$vPxW.7g87r9/eGg8hW6xye.5Y2aF75iWJ.9eP6lHn9dD7f2g/G.2u',
        role: 'ADMIN'
      }
    });
    const adminToken = generateToken({ userId: adminUser.id, email: adminUser.email, role: 'ADMIN' });
    console.log('Admin created.');

    // Fetch Tags for setup
    const categoryTag = await prisma.tag.findFirst({ where: { type: 'CATEGORY', isActive: true } });
    const skillTag = await prisma.tag.findFirst({ where: { type: 'SKILL', isActive: true } });
    if (!categoryTag || !skillTag) {
      throw new Error('Database is missing tags. Make sure the seed script has run.');
    }

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ==========================================
    // 3. SETUP DECISION TABLE TEST PROJECT
    // ==========================================
    console.log('\n--- Setting up Projects for Decision Table Testing ---');
    
    // Project 1 (OPEN status for application testing)
    const projectOpen = await prisma.project.create({
      data: {
        smeId: smeOwnerProfile!.id,
        title: 'Decision Table Open Project',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1000000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        status: ProjectStatus.OPEN,
        milestones: {
          create: [
            { title: 'M1', description: 'Desc 1', deadline: tomorrow, orderIndex: 1, amountVnd: 500000, status: MilestoneStatus.PENDING },
            { title: 'M2', description: 'Desc 2', deadline: tomorrow, orderIndex: 2, amountVnd: 500000, status: MilestoneStatus.PENDING }
          ]
        }
      },
      include: { milestones: true }
    });

    // Project 2 (IN_PROGRESS status for milestone submission testing)
    const projectInProgress = await prisma.project.create({
      data: {
        smeId: smeOwnerProfile!.id,
        title: 'Decision Table In Progress Project',
        description: 'This is a long description satisfying character length constraints.',
        categoryTagId: categoryTag.id,
        requiredSkillTags: [skillTag.name],
        budget: 1500000,
        durationWeeks: 4,
        maxApplicants: 2,
        deadline: nextWeek,
        status: ProjectStatus.IN_PROGRESS,
        escrowStatus: 'HELD',
        milestones: {
          create: [
            { title: 'Milestone IP 1', description: 'Desc 1', deadline: tomorrow, orderIndex: 1, amountVnd: 750000, status: MilestoneStatus.IN_PROGRESS },
            { title: 'Milestone IP 2', description: 'Desc 2', deadline: tomorrow, orderIndex: 2, amountVnd: 750000, status: MilestoneStatus.PENDING }
          ]
        }
      },
      include: { milestones: true }
    });

    // Create Application and Match student to projectInProgress
    await prisma.application.create({
      data: {
        projectId: projectInProgress.id,
        studentId: matchedStudentProfile!.id,
        status: ApplicationStatus.ACCEPTED,
        coverMessage: 'Match me!'
      }
    });
    console.log('Matched Student associated with projectInProgress.');

    const milestoneIp1Id = projectInProgress.milestones.find(m => m.orderIndex === 1)!.id;
    const milestoneIp2Id = projectInProgress.milestones.find(m => m.orderIndex === 2)!.id;

    // ==========================================
    // DECISION TABLE 1: SUBMIT MILESTONE DELIVERABLE
    // ==========================================
    console.log('\n--- Testing Decision Table 1: Submit Milestone Deliverable ---');

    // Rule 1: Student is matched + Project is IN_PROGRESS + Milestone is not accepted + Valid URL
    // Expected: 200 OK, milestone status SUBMITTED
    const r1 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${matchedStudentToken}`)
      .send({ deliverableUrl: 'https://github.com/matched/project' });
    assertStatus(r1.status, 200, 'DT1-R1: Success submit deliverable');

    // Reset status of Milestone IP 1 back to IN_PROGRESS for subsequent rules
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.IN_PROGRESS, deliverableUrl: null, submittedAt: null }
    });

    // Rule 2: Student is matched + Project is IN_PROGRESS + Milestone is not accepted + Invalid URL
    // Expected: 400 Validation Error
    const r2 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${matchedStudentToken}`)
      .send({ deliverableUrl: 'invalid-url' });
    assertStatus(r2.status, 400, 'DT1-R2: Reject invalid URL format');

    // Rule 2b: Empty URL
    const r2b = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${matchedStudentToken}`)
      .send({ deliverableUrl: '' });
    assertStatus(r2b.status, 400, 'DT1-R2b: Reject empty URL');

    // Rule 3: Student is matched + Project is IN_PROGRESS + Milestone is ALREADY ACCEPTED + Valid URL
    // First, set milestone to ACCEPTED directly in DB
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.ACCEPTED }
    });
    const r3 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${matchedStudentToken}`)
      .send({ deliverableUrl: 'https://github.com/matched/project' });
    // Expected: 400 or 403 (Cannot submit to already accepted milestone)
    assert(r3.status === 400 || r3.status === 403, `DT1-R3: Reject submit to accepted milestone (Got: ${r3.status})`);
    
    // Reset milestone back to IN_PROGRESS
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.IN_PROGRESS }
    });

    // Rule 4: Student is UNMATCHED + Project is IN_PROGRESS + Milestone is not accepted + Valid URL
    // Expected: 403 Forbidden
    const r4 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${unmatchedStudentToken}`)
      .send({ deliverableUrl: 'https://github.com/unmatched/project' });
    assertStatus(r4.status, 403, 'DT1-R4: Reject unmatched student submission');

    // Rule 5: Student is matched + Project is NOT IN_PROGRESS + Milestone is not accepted + Valid URL
    // We will set projectInProgress status to completed temporarily
    await prisma.project.update({
      where: { id: projectInProgress.id },
      data: { status: ProjectStatus.COMPLETED }
    });
    const r5 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${matchedStudentToken}`)
      .send({ deliverableUrl: 'https://github.com/matched/project' });
    assertStatus(r5.status, 403, 'DT1-R5: Reject submission if project is not in progress');
    
    // Reset project back to IN_PROGRESS
    await prisma.project.update({
      where: { id: projectInProgress.id },
      data: { status: ProjectStatus.IN_PROGRESS }
    });

    // Rule 6: Role is SME/ADMIN + Project IN_PROGRESS + Valid URL
    // Expected: 403 Forbidden (since route middleware requireRole(['STUDENT']) blocks other roles)
    const r6_sme = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${smeOwnerToken}`)
      .send({ deliverableUrl: 'https://github.com/sme/project' });
    assertStatus(r6_sme.status, 403, 'DT1-R6a: Reject SME role from submitting milestones');

    const r6_admin = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliverableUrl: 'https://github.com/admin/project' });
    assertStatus(r6_admin.status, 403, 'DT1-R6b: Reject Admin role from submitting milestones');

    // Rule 7: Guest (Unauthenticated) + Valid URL
    // Expected: 401 Unauthorized
    const r7 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/submit`)
      .send({ deliverableUrl: 'https://github.com/guest/project' });
    assertStatus(r7.status, 401, 'DT1-R7: Reject guest (unauthenticated) submission');


    // ==========================================
    // DECISION TABLE 2: REVIEW MILESTONE (APPROVE/REVISE)
    // ==========================================
    console.log('\n--- Testing Decision Table 2: Review Milestone ---');

    // Setup milestone in SUBMITTED state for testing
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.SUBMITTED, deliverableUrl: 'https://github.com/matched/project' }
    });

    // Rule 1: SME Owner + Milestone status is SUBMITTED + Action is APPROVE
    // Expected: 200 OK, milestone status ACCEPTED
    const r2_1 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .set('Authorization', `Bearer ${smeOwnerToken}`)
      .send({ action: 'APPROVE' });
    assertStatus(r2_1.status, 200, 'DT2-R1: Success approve by SME Owner');

    // Reset milestone back to SUBMITTED
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.SUBMITTED, deliverableUrl: 'https://github.com/matched/project' }
    });

    // Rule 2: SME Owner + Milestone status is SUBMITTED + Action is REVISE + Feedback provided
    // Expected: 200 OK, milestone status REVISION_REQUIRED
    const r2_2 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .set('Authorization', `Bearer ${smeOwnerToken}`)
      .send({ action: 'REVISE', feedback: 'Please update documentation.' });
    assertStatus(r2_2.status, 200, 'DT2-R2: Success request revision with feedback');

    // Reset milestone back to SUBMITTED
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.SUBMITTED, deliverableUrl: 'https://github.com/matched/project' }
    });

    // Rule 3: SME Owner + Milestone status is SUBMITTED + Action is REVISE + Feedback is empty
    // Expected: 400 Bad Request
    const r2_3 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .set('Authorization', `Bearer ${smeOwnerToken}`)
      .send({ action: 'REVISE', feedback: '' });
    assertStatus(r2_3.status, 400, 'DT2-R3: Reject revision request with empty feedback');

    // Rule 4: SME Owner + Milestone status is NOT SUBMITTED (e.g. ACCEPTED) + Action is APPROVE/REVISE
    // First, set milestone to ACCEPTED directly in DB
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.ACCEPTED }
    });
    const r2_4 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .set('Authorization', `Bearer ${smeOwnerToken}`)
      .send({ action: 'APPROVE' });
    assertStatus(r2_4.status, 403, 'DT2-R4: Reject review of non-submitted milestone');

    // Rule 5: ADMIN + Milestone status is SUBMITTED + Action is APPROVE
    // Expected: 200 OK (Admin can review/approve)
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.SUBMITTED, deliverableUrl: 'https://github.com/matched/project' }
    });
    const r2_5 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE' });
    assertStatus(r2_5.status, 200, 'DT2-R5: Success approve by Admin');

    // Rule 6: SME Other (non-owner) + Milestone status is SUBMITTED + Action is APPROVE
    // Expected: 403 Forbidden
    await prisma.milestone.update({
      where: { id: milestoneIp1Id },
      data: { status: MilestoneStatus.SUBMITTED, deliverableUrl: 'https://github.com/matched/project' }
    });
    const r2_6 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .set('Authorization', `Bearer ${smeOtherToken}`)
      .send({ action: 'APPROVE' });
    assertStatus(r2_6.status, 403, 'DT2-R6: Reject review by non-owner SME');

    // Rule 7: Student + Milestone status is SUBMITTED + Action is APPROVE
    // Expected: 403 Forbidden
    const r2_7 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .set('Authorization', `Bearer ${matchedStudentToken}`)
      .send({ action: 'APPROVE' });
    assertStatus(r2_7.status, 403, 'DT2-R7: Reject review by Student');

    // Rule 8: Guest (unauthenticated) + Milestone status is SUBMITTED + Action is APPROVE
    // Expected: 401 Unauthorized
    const r2_8 = await request
      .patch(`/api/milestones/${milestoneIp1Id}/review`)
      .send({ action: 'APPROVE' });
    assertStatus(r2_8.status, 401, 'DT2-R8: Reject review by Guest');


    // ==========================================
    // DECISION TABLE 3: APPLY TO PROJECT
    // ==========================================
    console.log('\n--- Testing Decision Table 3: Apply to Project ---');

    // Rule 1: Student + Project is OPEN + Profile is Complete + First time applying
    // Expected: 201 Created
    const r3_1 = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${unmatchedStudentToken}`)
      .send({ projectId: projectOpen.id, coverMessage: 'I am qualified!' });
    assertStatus(r3_1.status, 201, 'DT3-R1: Success apply to open project');

    // Rule 2: Student + Project is OPEN + Profile is INCOMPLETE + First time applying
    // Expected: 400 Bad Request (Wait, is this validation implemented on the backend? Let's check!)
    const r3_2 = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${incompleteStudentToken}`)
      .send({ projectId: projectOpen.id, coverMessage: 'Please accept me despite empty profile' });
    // Let's print the status to see if it bypasses validation!
    console.log(`[LOG] DT3-R2 Status returned: ${r3_2.status}`);
    assertStatus(r3_2.status, 400, 'DT3-R2: Reject application from incomplete profile student');

    // Rule 3: Student + Project is OPEN + Profile is Complete + Duplicate application
    // Expected: 400 Bad Request
    const r3_3 = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${unmatchedStudentToken}`)
      .send({ projectId: projectOpen.id, coverMessage: 'I am applying again!' });
    assertStatus(r3_3.status, 400, 'DT3-R3: Reject duplicate application');

    // Rule 4: Student + Project is NOT OPEN (e.g. IN_PROGRESS) + Profile is Complete
    // Expected: 400 Bad Request (Cannot apply to in progress project)
    const r3_4 = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${unmatchedStudentToken}`)
      .send({ projectId: projectInProgress.id, coverMessage: 'Applying to in-progress project' });
    assertStatus(r3_4.status, 400, 'DT3-R4: Reject application to in-progress project');

    // Rule 5: SME/Admin + Project is OPEN
    // Expected: 403 Forbidden
    const r3_5 = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${smeOwnerToken}`)
      .send({ projectId: projectOpen.id });
    assertStatus(r3_5.status, 403, 'DT3-R5: Reject SME application to project');

    // Rule 6: Guest (unauthenticated) + Project is OPEN
    // Expected: 401 Unauthorized
    const r3_6 = await request
      .post('/api/applications')
      .send({ projectId: projectOpen.id });
    assertStatus(r3_6.status, 401, 'DT3-R6: Reject guest application to project');

    // Clean up created admin & users
    console.log('\n🧹 Final cleanup of test data...');
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
    console.log('Cleanup completed.');

  } catch (error: any) {
    console.error('💥 Error running decision table tests:', error);
  } finally {
    console.log('\n======================================================');
    console.log(`📊 Decision Table Testing Results: Passed: ${passedCount}, Failed: ${failedCount}`);
    console.log('======================================================\n');
  }
}

runDecisionTableTests().catch((e) => console.error(e));
