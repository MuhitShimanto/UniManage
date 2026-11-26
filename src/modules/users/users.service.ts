import { uploadBufferToCloudinary } from '../../config/cloudinary';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/appError';

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      createdAt: true,
      studentProfile: {
        include: {
          program: { select: { id: true, code: true, name: true } },
        },
      },
      instructorProfile: {
        include: {
          department: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }
  return user;
}

export async function updateMyProfile(
  userId: string,
  data: { name?: string; phone?: string }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      updatedAt: true,
    },
  });
}

export async function updateMyAvatar(userId: string, file?: Express.Multer.File) {
  if (!file) {
    throw new AppError('Avatar image file is required.', 400);
  }

  const uploaded = await uploadBufferToCloudinary(
    file.buffer,
    'university-management/avatars',
    'image'
  );

  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: uploaded.url },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });
}
