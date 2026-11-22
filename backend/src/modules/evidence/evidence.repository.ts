import type { Evidence, Prisma } from '@prisma/client';
import { prisma } from '../../database/client';

export const evidenceRepository = {
  listByIncident(incidentId: string): Promise<Evidence[]> {
    return prisma.evidence.findMany({
      where: { incidentId },
      orderBy: [{ availableAt: 'asc' }, { id: 'asc' }],
    });
  },

  /** Returns which of the given URLs are already stored (for any incident). */
  async findExistingUrls(urls: string[]): Promise<Set<string>> {
    if (!urls.length) return new Set();
    const rows = await prisma.evidence.findMany({
      where: { sourceUrl: { in: urls } },
      select: { sourceUrl: true },
    });
    return new Set(rows.flatMap((r) => (r.sourceUrl ? [r.sourceUrl] : [])));
  },

  /**
   * Inserts evidence, bumps the incident's `lastUpdatedAt` and the source's report counter
   * atomically, so a partial failure cannot leave the counters out of sync.
   */
  createForIncident(data: Prisma.EvidenceUncheckedCreateInput): Promise<Evidence> {
    return prisma.$transaction(async (tx) => {
      const evidence = await tx.evidence.create({ data });
      await tx.incident.update({
        where: { id: data.incidentId },
        data: { lastUpdatedAt: data.ingestedAt },
      });
      await tx.source.update({
        where: { id: data.sourceId },
        data: { reports: { increment: 1 } },
      });
      return evidence;
    });
  },
};
