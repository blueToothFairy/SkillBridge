"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./config/prisma");
async function testAuthFlow() {
    console.log('🧪 Starting Auth Flow E2E Integration Test...');
    await prisma_1.prisma.user.deleteMany({
        where: {
            email: {
                in: ['test_student@example.com', 'test_sme@example.com'],
            },
        },
    });
    const request = (0, supertest_1.default)(app_1.default);
    console.log('1. Testing Student 2-Step Registration...');
    const studentRes = await request.post('/api/auth/register').send({
        account: {
            email: 'test_student@example.com',
            password: 'Password123!',
            role: 'STUDENT',
        },
        profile: {
            fullName: 'Nguyen Student',
            university: 'HCMUT',
            major: 'Computer Science',
            year: 3,
            skills: { expert: ['React'], proficient: ['Node.js'], familiar: ['PostgreSQL'] },
        },
    });
    if (studentRes.status !== 201 || !studentRes.body.data.token) {
        throw new Error(`Student registration failed: ${JSON.stringify(studentRes.body)}`);
    }
    console.log('✅ Student 2-Step Registration Success!');
    console.log('2. Testing SME 2-Step Registration...');
    const smeRes = await request.post('/api/auth/register').send({
        account: {
            email: 'test_sme@example.com',
            password: 'Password123!',
            role: 'SME',
        },
        profile: {
            companyName: 'Tech Solutions Inc.',
            taxCode: '0319998887',
            industry: 'Software',
        },
    });
    if (smeRes.status !== 201 || !smeRes.body.data.token) {
        throw new Error(`SME registration failed: ${JSON.stringify(smeRes.body)}`);
    }
    console.log('✅ SME 2-Step Registration Success!');
    console.log('3. Testing Invalid Password Login...');
    const invalidLogin = await request.post('/api/auth/login').send({
        email: 'test_student@example.com',
        password: 'WrongPassword!',
    });
    if (invalidLogin.status !== 401) {
        throw new Error(`Expected 401 for invalid password, got ${invalidLogin.status}`);
    }
    console.log('✅ Invalid Login rejected with 401 Unauthorized!');
    console.log('4. Testing Valid Password Login...');
    const validLogin = await request.post('/api/auth/login').send({
        email: 'test_student@example.com',
        password: 'Password123!',
    });
    if (validLogin.status !== 200 || !validLogin.body.data.token) {
        throw new Error(`Valid login failed: ${JSON.stringify(validLogin.body)}`);
    }
    const token = validLogin.body.data.token;
    console.log('✅ Valid Login Success!');
    console.log('5. Testing GET /api/auth/me with Bearer Token...');
    const meRes = await request.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    if (meRes.status !== 200 || meRes.body.data.user.email !== 'test_student@example.com') {
        throw new Error(`GET /api/auth/me failed: ${JSON.stringify(meRes.body)}`);
    }
    console.log('✅ GET /api/auth/me Success!');
    await prisma_1.prisma.user.deleteMany({
        where: {
            email: {
                in: ['test_student@example.com', 'test_sme@example.com'],
            },
        },
    });
    console.log('🎉 All Auth E2E Tests Passed Successfully!');
    process.exit(0);
}
testAuthFlow().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
