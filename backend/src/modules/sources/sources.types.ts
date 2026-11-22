import type { Source } from '@prisma/client';

/** Mirrors `Source` in frontend/src/types/domain.ts. */
export interface SourceDto {
  id: string;
  name: string;
  type: string;
  url: string;
  status: Source['status'];
  enabled: boolean;
  lastSync: string;
  lastAttempt: string;
  frequency: string;
  reports: number;
  error: string | null;
}

export const toSourceDto = (row: Source): SourceDto => ({
  id: row.id,
  name: row.name,
  type: row.type,
  url: row.url,
  status: row.status,
  enabled: row.enabled,
  lastSync: row.lastSync.toISOString(),
  lastAttempt: row.lastAttempt.toISOString(),
  frequency: row.frequency,
  reports: row.reports,
  error: row.error,
});
