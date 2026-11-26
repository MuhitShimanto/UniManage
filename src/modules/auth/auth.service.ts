import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { recordAuditLog } from '../../utils/auditLog';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

async function issueTokens(user: { id: string; email: string; role: Role }) {
  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  return { accessToken, refreshToken };
}

export async function registerStudent(
  input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    programId: string;
    admissionYear?: number;
  },
  ipAddress?: string
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const program = await prisma.program.findFirst({
    where: { id: input.programId, deletedAt: null },
  });
  if (!program) {
    throw new AppError('Selected academic program not found.', 404);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const year = input.admissionYear ?? new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const studentCode = `${year}-${program.code}-${randomSuffix}`;

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone,
        role: Role.STUDENT,
      },
    });

    await tx.studentProfile.create({
      data: {
        userId: created.id,
        studentCode,
        programId: program.id,
        admissionYear: year,
      },
    });

    return created;
  });

  const tokens = await issueTokens(user);
  await recordAuditLog({
    actorId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user.id,
    ipAddress,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentCode,
    },
    ...tokens,
  };
}

export async function loginWithPassword(
  input: { email: string; password: string },
  ipAddress?: string
) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Contact an administrator.', 403);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokens = await issueTokens(user);
  await recordAuditLog({
    actorId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    ipAddress,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    ...tokens,
  };
}

export async function loginWithGoogle(
  input: { idToken: string; programId?: string },
  ipAddress?: string
) {
  if (!googleClient || !env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google OAuth is not configured. Set GOOGLE_CLIENT_ID in .env.', 503);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: input.idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError('Invalid Google ID token.', 401);
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email }], deletedAt: null },
  });

  if (!user) {
    const defaultProgram = input.programId
      ? await prisma.program.findFirst({ where: { id: input.programId, deletedAt: null } })
      : await prisma.program.findFirst({ where: { deletedAt: null } });

    if (!defaultProgram) {
      throw new AppError('No active academic program found to register Google user.', 400);
    }

    const year = new Date().getFullYear();
    const studentCode = `${year}-${defaultProgram.code}-${Math.floor(1000 + Math.random() * 9000)}`;

    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: payload.email!,
          googleId: payload.sub,
          name: payload.name || payload.email!.split('@')[0],
          avatarUrl: payload.picture,
          role: Role.STUDENT,
        },
      });
      await tx.studentProfile.create({
        data: {
          userId: created.id,
          studentCode,
          programId: defaultProgram.id,
          admissionYear: year,
        },
      });
      return created;
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub, avatarUrl: user.avatarUrl || payload.picture },
    });
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated.', 403);
  }

  const tokens = await issueTokens(user);
  await recordAuditLog({
    actorId: user.id,
    action: 'USER_GOOGLE_LOGIN',
    entityType: 'User',
    entityId: user.id,
    ipAddress,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    ...tokens,
  };
}

export async function refreshAuthTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.userId, deletedAt: null, isActive: true },
  });

  if (!user || !user.refreshTokenHash) {
    throw new AppError('Refresh session not found.', 401);
  }

  const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!matches) {
    throw new AppError('Refresh token mismatch.', 401);
  }

  return issueTokens(user);
}

export async function logoutUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}
