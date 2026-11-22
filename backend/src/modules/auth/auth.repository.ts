import type { Prisma, User, UserRole } from '@prisma/client';
import { prisma } from '../../database/client';

export const authRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  updateRole(id: string, role: UserRole): Promise<User> {
    return prisma.user.update({ where: { id }, data: { role } });
  },
};
