"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
const prisma_1 = require("../../config/prisma");
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const response_1 = require("../../utils/response");
async function register(req, res) {
    try {
        const { account, profile } = req.body;
        if (!account || !account.email || !account.password || !account.role) {
            return (0, response_1.sendError)(res, 'Account details (email, password, role) are required', 400, 'VALIDATION_ERROR');
        }
        const { email, password, role } = account;
        if (role !== 'STUDENT' && role !== 'SME') {
            return (0, response_1.sendError)(res, 'Role must be STUDENT or SME', 400, 'INVALID_ROLE');
        }
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            return (0, response_1.sendError)(res, 'Email already registered', 400, 'EMAIL_EXISTS');
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase(),
                    passwordHash,
                    role,
                },
            });
            let createdProfile = null;
            if (role === 'STUDENT') {
                if (!profile || !profile.fullName || !profile.university || !profile.major) {
                    throw new Error('Student profile details (fullName, university, major) are required');
                }
                createdProfile = await tx.studentProfile.create({
                    data: {
                        userId: user.id,
                        fullName: profile.fullName,
                        university: profile.university,
                        major: profile.major,
                        year: profile.year || 1,
                        skills: profile.skills || { expert: [], proficient: [], familiar: [] },
                    },
                });
            }
            else if (role === 'SME') {
                if (!profile || !profile.companyName) {
                    throw new Error('SME profile details (companyName) are required');
                }
                createdProfile = await tx.smeProfile.create({
                    data: {
                        userId: user.id,
                        companyName: profile.companyName,
                        taxCode: profile.taxCode || null,
                        industry: profile.industry || null,
                        website: profile.website || null,
                    },
                });
            }
            return { user, profile: createdProfile };
        });
        const token = (0, jwt_1.generateToken)({
            userId: result.user.id,
            email: result.user.email,
            role: result.user.role,
        });
        return (0, response_1.sendSuccess)(res, {
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role,
                profile: result.profile,
            },
        }, 201);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Registration failed', 400, 'REGISTRATION_FAILED');
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return (0, response_1.sendError)(res, 'Email and password are required', 400, 'VALIDATION_ERROR');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                studentProfile: true,
                smeProfile: true,
            },
        });
        if (!user) {
            return (0, response_1.sendError)(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        const isMatch = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isMatch) {
            return (0, response_1.sendError)(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const profile = user.role === 'STUDENT' ? user.studentProfile : user.smeProfile;
        return (0, response_1.sendSuccess)(res, {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile,
            },
        });
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Login failed', 500, 'SERVER_ERROR');
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                studentProfile: true,
                smeProfile: true,
            },
        });
        if (!user) {
            return (0, response_1.sendError)(res, 'User not found', 404, 'NOT_FOUND');
        }
        const profile = user.role === 'STUDENT' ? user.studentProfile : user.smeProfile;
        return (0, response_1.sendSuccess)(res, {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile,
            },
        });
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to fetch user', 500, 'SERVER_ERROR');
    }
}
async function updateProfile(req, res) {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
        }
        const { userId, role } = req.user;
        const updateData = req.body;
        let updatedProfile = null;
        if (role === 'STUDENT') {
            const existing = await prisma_1.prisma.studentProfile.findUnique({ where: { userId } });
            if (!existing) {
                return (0, response_1.sendError)(res, 'Student profile not found', 404, 'NOT_FOUND');
            }
            updatedProfile = await prisma_1.prisma.studentProfile.update({
                where: { userId },
                data: {
                    ...(updateData.fullName ? { fullName: updateData.fullName } : {}),
                    ...(updateData.university ? { university: updateData.university } : {}),
                    ...(updateData.major ? { major: updateData.major } : {}),
                    ...(updateData.year ? { year: Number(updateData.year) } : {}),
                    ...(updateData.skills ? { skills: updateData.skills } : {}),
                },
            });
        }
        else if (role === 'SME') {
            const existing = await prisma_1.prisma.smeProfile.findUnique({ where: { userId } });
            if (!existing) {
                return (0, response_1.sendError)(res, 'SME profile not found', 404, 'NOT_FOUND');
            }
            updatedProfile = await prisma_1.prisma.smeProfile.update({
                where: { userId },
                data: {
                    ...(updateData.companyName ? { companyName: updateData.companyName } : {}),
                    ...(updateData.taxCode !== undefined ? { taxCode: updateData.taxCode } : {}),
                    ...(updateData.industry !== undefined ? { industry: updateData.industry } : {}),
                    ...(updateData.website !== undefined ? { website: updateData.website } : {}),
                },
            });
        }
        else {
            return (0, response_1.sendError)(res, 'Invalid user role', 400, 'INVALID_ROLE');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        return (0, response_1.sendSuccess)(res, {
            user: {
                id: user?.id,
                email: user?.email,
                role: user?.role,
                profile: updatedProfile,
            },
        });
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to update profile', 500, 'SERVER_ERROR');
    }
}
