"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./config/prisma");
async function testMilestoneFlow() {
    console.log('🧪 Starting Milestone Flow E2E Integration Test...');
    // 1. Cleanup old test data
    console.log('Cleaning up old test users & data...');
    const testEmails = ['mile_student@example.com', 'mile_sme@example.com'];
    await prisma_1.prisma.application.deleteMany({
        where: { student: { user: { email: { in: testEmails } } } }
    });
    await prisma_1.prisma.milestone.deleteMany({
        where: { project: { sme: { user: { email: { in: testEmails } } } } }
    });
    await prisma_1.prisma.project.deleteMany({
        where: { sme: { user: { email: { in: testEmails } } } }
    });
    await prisma_1.prisma.user.deleteMany({
        where: { email: { in: testEmails } }
    });
    const request = (0, supertest_1.default)(app_1.default);
    // 2. Setup Student and SME Profiles
    console.log('Creating student profile...');
    const studentRegister = await request.post('/api/auth/register').send({
        account: { email: 'mile_student@example.com', password: 'Password123!', role: 'STUDENT' },
        profile: { fullName: 'Milestone Student', university: 'HCMUT', major: 'IT', year: 3, skills: { expert: ['React'] } }
    });
    const studentToken = studentRegister.body.data.token;
    const studentProfile = await prisma_1.prisma.studentProfile.findFirst({
        where: { user: { email: 'mile_student@example.com' } }
    });
    console.log('Creating SME profile...');
    const smeRegister = await request.post('/api/auth/register').send({
        account: { email: 'mile_sme@example.com', password: 'Password123!', role: 'SME' },
        profile: { companyName: 'Milestone SME Ltd', taxCode: '1234567890', industry: 'Tech' }
    });
    const smeToken = smeRegister.body.data.token;
    const smeProfile = await prisma_1.prisma.smeProfile.findFirst({
        where: { user: { email: 'mile_sme@example.com' } }
    });
    if (!studentProfile || !smeProfile) {
        throw new Error('Failed to setup profiles');
    }
    // 3. Find a Category Tag
    const categoryTag = await prisma_1.prisma.tag.findFirst({
        where: { type: 'CATEGORY', isActive: true }
    });
    if (!categoryTag) {
        throw new Error('No category tags found in DB to associate project.');
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    // 4. Test Project Creation Validation (Task 4.1)
    console.log('Testing Project Creation with Mismatched Milestone Budget...');
    const badBudgetProject = await request
        .post('/api/projects')
        .set('Authorization', `Bearer ${smeToken}`)
        .send({
        title: 'Mismatched Budget Project',
        description: 'Project description of correct length character count.',
        categoryTagId: categoryTag.id,
        budget: 5000000,
        durationWeeks: 4,
        milestones: [
            { title: 'Milestone 1', description: 'Description of length matching rules', deadline: tomorrow, amountVnd: 2000000 },
            { title: 'Milestone 2', description: 'Description of length matching rules', deadline: nextWeek, amountVnd: 2000000 }
        ]
    });
    if (badBudgetProject.status !== 400 || !badBudgetProject.body.error?.message.includes('equal total project budget')) {
        throw new Error(`Expected 400 validation error for budget mismatch, got: ${badBudgetProject.status} ${JSON.stringify(badBudgetProject.body)}`);
    }
    console.log('✅ Rejected mismatched milestone budget correctly!');
    console.log('Testing Project Creation with Invalid Milestones Deadline...');
    const badDeadlineProject = await request
        .post('/api/projects')
        .set('Authorization', `Bearer ${smeToken}`)
        .send({
        title: 'Mismatched Deadline Project',
        description: 'Project description of correct length character count.',
        categoryTagId: categoryTag.id,
        budget: 5000000,
        durationWeeks: 4,
        deadline: tomorrow,
        milestones: [
            { title: 'Milestone 1', description: 'Description of length matching rules', deadline: nextWeek, amountVnd: 5000000 }
        ]
    });
    if (badDeadlineProject.status !== 400 || !(badDeadlineProject.body.error?.message.includes('deadline') || badDeadlineProject.body.error?.message.includes('Hạn chót'))) {
        throw new Error(`Expected 400 validation error for deadline violation, got: ${badDeadlineProject.status} ${JSON.stringify(badDeadlineProject.body)}`);
    }
    console.log('✅ Rejected milestone deadline after project deadline correctly!');
    console.log('Creating valid Project with Milestones...');
    const projectRes = await request
        .post('/api/projects')
        .set('Authorization', `Bearer ${smeToken}`)
        .send({
        title: 'Test Milestone Project',
        description: 'Project description of correct length character count.',
        categoryTagId: categoryTag.id,
        budget: 6000000,
        durationWeeks: 4,
        deadline: nextWeek,
        milestones: [
            { title: 'Milestone 1', description: 'Description of length matching rules', deadline: tomorrow, amountVnd: 2000000 },
            { title: 'Milestone 2', description: 'Description of length matching rules', deadline: nextWeek, amountVnd: 4000000 }
        ]
    });
    if (projectRes.status !== 201) {
        throw new Error(`Project creation failed: ${JSON.stringify(projectRes.body)}`);
    }
    const project = projectRes.body.data;
    console.log('✅ Project & Milestones created successfully in one transaction!');
    // 5. Setup Project Matching Simulation (Accepted Application)
    console.log('Simulating SME matching and transitioning project to IN_PROGRESS...');
    await prisma_1.prisma.application.create({
        data: {
            projectId: project.id,
            studentId: studentProfile.id,
            status: 'ACCEPTED'
        }
    });
    await prisma_1.prisma.project.update({
        where: { id: project.id },
        data: { status: 'IN_PROGRESS' }
    });
    // 6. Fetch Milestones List
    console.log('Fetching milestones list...');
    const milestoneList = await request
        .get(`/api/milestones?projectId=${project.id}`)
        .set('Authorization', `Bearer ${studentToken}`);
    if (milestoneList.status !== 200 || milestoneList.body.data.length !== 2) {
        throw new Error(`Failed to fetch milestones list: ${JSON.stringify(milestoneList.body)}`);
    }
    const milestones = milestoneList.body.data;
    const m1 = milestones[0];
    const m2 = milestones[1];
    console.log('✅ Milestones fetched and ordered successfully!');
    // 7. Test Student Submission (Task 4.2)
    console.log('Testing deliverable submission from unauthorized student...');
    const unauthorizedSmeSubmit = await request
        .patch(`/api/milestones/${m1.id}/submit`)
        .set('Authorization', `Bearer ${smeToken}`) // SME cannot submit deliverables
        .send({ deliverableUrl: 'https://github.com/test' });
    if (unauthorizedSmeSubmit.status !== 403) {
        throw new Error(`Expected 403 Forbidden for non-student submission, got: ${unauthorizedSmeSubmit.status}`);
    }
    console.log('✅ Non-student deliverable submission rejected with 403 Forbidden!');
    console.log('Testing invalid deliverable URL syntax...');
    const badUrlSubmit = await request
        .patch(`/api/milestones/${m1.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ deliverableUrl: 'invalid-url-format' });
    if (badUrlSubmit.status !== 400) {
        throw new Error(`Expected 400 validation error for invalid URL, got: ${badUrlSubmit.status}`);
    }
    console.log('✅ Rejected invalid deliverable URL syntax correctly!');
    console.log('Submitting valid deliverable URL as matched student...');
    const submitRes = await request
        .patch(`/api/milestones/${m1.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ deliverableUrl: 'https://github.com/my-student-repo/deliverable1' });
    if (submitRes.status !== 200 || submitRes.body.data.status !== 'SUBMITTED') {
        throw new Error(`Deliverable submission failed: ${JSON.stringify(submitRes.body)}`);
    }
    console.log('✅ Student deliverable URL submitted successfully!');
    console.log('Testing cancelling submission...');
    const cancelRes = await request
        .patch(`/api/milestones/${m1.id}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);
    if (cancelRes.status !== 200 || cancelRes.body.data.status !== 'PENDING' || cancelRes.body.data.deliverableUrl !== null) {
        throw new Error(`Deliverable cancellation failed: ${JSON.stringify(cancelRes.body)}`);
    }
    console.log('✅ Student deliverable URL cancelled successfully, status reverted to PENDING!');
    // Re-submit so we can continue the rest of the test
    console.log('Re-submitting deliverable URL for approval flow test...');
    await request
        .patch(`/api/milestones/${m1.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ deliverableUrl: 'https://github.com/my-student-repo/deliverable1' });
    // 8. Test SME Review & Approval (Task 4.3)
    console.log('Testing review from unauthorized student role...');
    const badReview = await request
        .patch(`/api/milestones/${m1.id}/review`)
        .set('Authorization', `Bearer ${studentToken}`) // Students cannot review milestones
        .send({ action: 'APPROVE' });
    if (badReview.status !== 403) {
        throw new Error(`Expected 403 Forbidden for student review, got: ${badReview.status}`);
    }
    console.log('✅ Student review rejected with 403 Forbidden!');
    console.log('Approving Milestone 1 as SME...');
    const review1Res = await request
        .patch(`/api/milestones/${m1.id}/review`)
        .set('Authorization', `Bearer ${smeToken}`)
        .send({ action: 'APPROVE' });
    if (review1Res.status !== 200 || review1Res.body.data.status !== 'ACCEPTED') {
        throw new Error(`Milestone 1 approval failed: ${JSON.stringify(review1Res.body)}`);
    }
    // Verify project is still IN_PROGRESS since milestone 2 is not completed
    let projectStatusCheck = await prisma_1.prisma.project.findUnique({ where: { id: project.id } });
    if (projectStatusCheck?.status !== 'IN_PROGRESS') {
        throw new Error(`Expected project to remain IN_PROGRESS, got: ${projectStatusCheck?.status}`);
    }
    console.log('✅ Milestone 1 approved, project status remains IN_PROGRESS!');
    // 9. Submit & Approve Milestone 2 to trigger project PENDING_ACCEPTANCE transition (Task 4.3)
    console.log('Submitting deliverable URL for Milestone 2...');
    await request
        .patch(`/api/milestones/${m2.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ deliverableUrl: 'https://github.com/my-student-repo/deliverable2' });
    console.log('Approving Milestone 2 to complete project milestones...');
    const review2Res = await request
        .patch(`/api/milestones/${m2.id}/review`)
        .set('Authorization', `Bearer ${smeToken}`)
        .send({ action: 'APPROVE' });
    if (review2Res.status !== 200 || review2Res.body.data.status !== 'ACCEPTED') {
        throw new Error(`Milestone 2 approval failed: ${JSON.stringify(review2Res.body)}`);
    }
    // Verify project is now PENDING_ACCEPTANCE since all milestones are accepted
    projectStatusCheck = await prisma_1.prisma.project.findUnique({ where: { id: project.id } });
    if (projectStatusCheck?.status !== 'PENDING_ACCEPTANCE') {
        throw new Error(`Expected project status to transition to PENDING_ACCEPTANCE, got: ${projectStatusCheck?.status}`);
    }
    console.log('✅ Milestone 2 approved! Project status successfully transitioned to PENDING_ACCEPTANCE!');
    // Clean up
    console.log('Cleaning up test data...');
    await prisma_1.prisma.application.deleteMany({
        where: { student: { user: { email: { in: testEmails } } } }
    });
    await prisma_1.prisma.milestone.deleteMany({
        where: { projectId: project.id }
    });
    await prisma_1.prisma.project.delete({
        where: { id: project.id }
    });
    await prisma_1.prisma.user.deleteMany({
        where: { email: { in: testEmails } }
    });
    console.log('🎉 All Milestone E2E Integration Tests Passed Successfully!');
    process.exit(0);
}
testMilestoneFlow().catch((err) => {
    console.error('❌ Integration Test Failed:', err);
    process.exit(1);
});
