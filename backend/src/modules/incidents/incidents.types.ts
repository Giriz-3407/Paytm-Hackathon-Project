import type { Prisma } from '@prisma/client';

export type IncidentRow = Prisma.IncidentGetPayload<{
  include: { evidence: { select: { id: true } } };
}>;

/** Mirrors `Incident` in frontend/src/types/domain.ts. */
export interface IncidentDto {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: IncidentRow['severity'];
  evidenceStatus: IncidentRow['evidenceStatus'];
  lifecycleStatus: IncidentRow['lifecycleStatus'];
  location: { city: string; state: string; district: string };
  coordinates: [number, number];
  firstDetectedAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
  summary: string;
  relatedEvidenceIds: string[];
  mode: IncidentRow['mode'];
}

/**
 * `sourceCount` and `relatedEvidenceIds` are derived from stored evidence rather than
 * persisted, so they can never drift from the evidence table.
 */
export const toIncidentDto = (row: IncidentRow): IncidentDto => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  severity: row.severity,
  evidenceStatus: row.evidenceStatus,
  lifecycleStatus: row.lifecycleStatus,
  location: { city: row.city, state: row.state, district: row.district },
  coordinates: [row.latitude, row.longitude],
  firstDetectedAt: row.firstDetectedAt.toISOString(),
  lastUpdatedAt: row.lastUpdatedAt.toISOString(),
  sourceCount: row.evidence.length,
  summary: row.summary,
  relatedEvidenceIds: row.evidence.map((e) => e.id),
  mode: row.mode,
});
