import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middlewares/auth';

export async function register(req: Request, res: Response): Promise<Response | void> {
  try {
    const { account, profile } = req.body;

    if (!account || !account.email || !account.password || !account.role) {
      return sendError(res, 'Account details (email, password, role) are required', 400, 'VALIDATION_ERROR');
    }

    const { email, password, role } = account;

    if (role !== 'STUDENT' && role !== 'SME') {
      return sendError(res, 'Role must be STUDENT or SME', 400, 'INVALID_ROLE');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return sendError(res, 'Email already registered', 400, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
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
      } else if (role === 'SME') {
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

    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          profile: result.profile,
        },
      },
      201
    );
  } catch (error: any) {
    return sendError(res, error.message || 'Registration failed', 400, 'REGISTRATION_FAILED');
  }
}

export async function login(req: Request, res: Response): Promise<Response | void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        studentProfile: true,
        smeProfile: true,
      },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const profile = user.role === 'STUDENT' ? user.studentProfile : user.smeProfile;

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Login failed', 500, 'SERVER_ERROR');
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        studentProfile: true,
        smeProfile: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    const profile = user.role === 'STUDENT' ? user.studentProfile : user.smeProfile;

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch user', 500, 'SERVER_ERROR');
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
    }

    const { userId, role } = req.user;
    const updateData = req.body;

    let updatedProfile = null;

    if (role === 'STUDENT') {
      const existing = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!existing) {
        return sendError(res, 'Student profile not found', 404, 'NOT_FOUND');
      }

      updatedProfile = await prisma.studentProfile.update({
        where: { userId },
        data: {
          ...(updateData.fullName ? { fullName: updateData.fullName } : {}),
          ...(updateData.university ? { university: updateData.university } : {}),
          ...(updateData.major ? { major: updateData.major } : {}),
          ...(updateData.year ? { year: Number(updateData.year) } : {}),
          ...(updateData.skills ? { skills: updateData.skills } : {}),
        },
      });
    } else if (role === 'SME') {
      const existing = await prisma.smeProfile.findUnique({ where: { userId } });
      if (!existing) {
        return sendError(res, 'SME profile not found', 404, 'NOT_FOUND');
      }

      updatedProfile = await prisma.smeProfile.update({
        where: { userId },
        data: {
          ...(updateData.companyName ? { companyName: updateData.companyName } : {}),
          ...(updateData.taxCode !== undefined ? { taxCode: updateData.taxCode } : {}),
          ...(updateData.industry !== undefined ? { industry: updateData.industry } : {}),
          ...(updateData.website !== undefined ? { website: updateData.website } : {}),
        },
      });
    } else {
      return sendError(res, 'Invalid user role', 400, 'INVALID_ROLE');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return sendSuccess(res, {
      user: {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        profile: updatedProfile,
      },
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update profile', 500, 'SERVER_ERROR');
  }
}
