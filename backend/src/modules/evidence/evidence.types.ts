import type { Evidence } from '@prisma/client';

/** Mirrors `Evidence` in frontend/src/types/domain.ts. */
export interface EvidenceDto {
  id: string;
  incidentId: string;
  sourceId: string;
  title: string;
  sourceUrl: string | null;
  publishedAt: string;
  availableAt: string;
  ingestedAt: string;
  content: string;
  verificationStatus: Evidence['verificationStatus'];
}

export const toEvidenceDto = (row: Evidence): EvidenceDto => ({
  id: row.id,
  incidentId: row.incidentId,
  sourceId: row.sourceId,
  title: row.title,
  sourceUrl: row.sourceUrl,
  publishedAt: row.publishedAt.toISOString(),
  availableAt: row.availableAt.toISOString(),
  ingestedAt: row.ingestedAt.toISOString(),
  content: row.content,
  verificationStatus: row.verificationStatus,
});
