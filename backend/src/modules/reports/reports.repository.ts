import type { Prisma, Report } from '@prisma/client';
import { prisma } from '../../database/client';
import { toSkipTake } from '../../utils/pagination';
import type { ListReportsQuery } from './reports.schemas';

export const reportsRepository = {
  async list(query: ListReportsQuery): Promise<{ items: Report[]; total: number }> {
    const where: Prisma.ReportWhereInput = query.incidentId ? { incidentId: query.incidentId } : {};
    const [items, total] = await prisma.$transaction([
      prisma.report.findMany({
        where,
        orderBy: [{ generatedAt: 'desc' }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.report.count({ where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({ where: { id } });
  },

  create(data: Prisma.ReportUncheckedCreateInput): Promise<Report> {
    return prisma.report.create({ data });
  },
};
