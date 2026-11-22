import { prisma } from '../../database/client';

export const healthRepository = {
  /** Resolves true when the database answers a trivial query. */
  async pingDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },
};
