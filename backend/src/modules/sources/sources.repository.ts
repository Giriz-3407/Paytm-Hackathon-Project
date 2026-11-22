import type { Source } from '@prisma/client';
import { prisma } from '../../database/client';

export const sourcesRepository = {
  list(): Promise<Source[]> {
    return prisma.source.findMany({ orderBy: { id: 'asc' } });
  },

  findById(id: string): Promise<Source | null> {
    return prisma.source.findUnique({ where: { id } });
  },

  recordRun(
    id: string,
    data: Pick<Source, 'status' | 'error' | 'lastAttempt'> & { lastSync?: Date },
  ): Promise<Source> {
    return prisma.source.update({ where: { id }, data });
  },

  setEnabled(id: string, enabled: boolean): Promise<Source> {
    return prisma.source.update({ where: { id }, data: { enabled } });
  },
};
