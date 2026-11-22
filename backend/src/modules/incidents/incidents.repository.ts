import type { DataMode, Prisma } from '@prisma/client';
import { prisma } from '../../database/client';
import { toSkipTake } from '../../utils/pagination';
import type { ListIncidentsQuery } from './incidents.schemas';
import type { IncidentRow } from './incidents.types';

// Replay content lives in its own tables; the incident list shows fictional demo data and live news.
const VISIBLE_MODES: DataMode[] = ['demo', 'live'];

const include = {
  evidence: { select: { id: true }, orderBy: [{ availableAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.IncidentInclude;

function buildWhere(q: ListIncidentsQuery): Prisma.IncidentWhereInput {
  const and: Prisma.IncidentWhereInput[] = [{ mode: q.mode ?? { in: VISIBLE_MODES } }];
  if (q.search) {
    const contains = { contains: q.search, mode: 'insensitive' as const };
    and.push({ OR: [{ title: contains }, { id: contains }, { city: contains }, { state: contains }] });
  }
  if (q.categories?.length) and.push({ category: { in: q.categories } });
  if (q.severities?.length) and.push({ severity: { in: q.severities } });
  if (q.evidence) and.push({ evidenceStatus: q.evidence });
  if (q.lifecycleStatus) and.push({ lifecycleStatus: q.lifecycleStatus });
  if (q.state) and.push({ state: q.state });
  if (q.district) and.push({ district: q.district });
  if (q.sourceId) and.push({ evidence: { some: { sourceId: q.sourceId } } });
  if (q.from || q.to) {
    and.push({
      firstDetectedAt: {
        ...(q.from && { gte: new Date(q.from) }),
        ...(q.to && { lte: new Date(q.to) }),
      },
    });
  }
  return { AND: and };
}

function buildOrderBy(sort: ListIncidentsQuery['sort']): Prisma.IncidentOrderByWithRelationInput[] {
  // `id` is a deterministic tie-breaker so pagination is stable.
  switch (sort) {
    case 'severity':
      return [{ severity: 'asc' }, { firstDetectedAt: 'desc' }, { id: 'asc' }];
    case 'updated':
      return [{ lastUpdatedAt: 'desc' }, { id: 'asc' }];
    default:
      return [{ firstDetectedAt: 'desc' }, { id: 'asc' }];
  }
}

export const incidentsRepository = {
  async list(query: ListIncidentsQuery): Promise<{ items: IncidentRow[]; total: number }> {
    const where = buildWhere(query);
    const [items, total] = await prisma.$transaction([
      prisma.incident.findMany({
        where,
        include,
        orderBy: buildOrderBy(query.sort),
        ...toSkipTake(query),
      }),
      prisma.incident.count({ where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<IncidentRow | null> {
    return prisma.incident.findFirst({ where: { id, mode: { in: VISIBLE_MODES } }, include });
  },

  /**
   * Most recent open live incident of the same category and state, used to cluster
   * new reports into an existing incident instead of creating near-duplicates.
   */
  findClusterCandidate(params: {
    category: string;
    state: string;
    since: Date;
  }): Promise<IncidentRow | null> {
    return prisma.incident.findFirst({
      where: {
        mode: 'live',
        category: params.category,
        state: params.state,
        lifecycleStatus: { not: 'Resolved' },
        lastUpdatedAt: { gte: params.since },
      },
      orderBy: { lastUpdatedAt: 'desc' },
      include,
    });
  },

  create(data: Prisma.IncidentCreateInput): Promise<IncidentRow> {
    return prisma.incident.create({ data, include });
  },

  update(id: string, data: Prisma.IncidentUpdateInput): Promise<IncidentRow> {
    return prisma.incident.update({ where: { id }, data, include });
  },
};
