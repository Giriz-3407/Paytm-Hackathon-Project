import type { Report } from '@prisma/client';

/** Mirrors `IntelligenceReport` in frontend/src/types/domain.ts. */
export interface ReportDto {
  id: string;
  incidentId: string;
  title: string;
  generatedAt: string;
  mode: Report['mode'];
  summary: string;
  findings: string[];
  limitations: string[];
  sources: string[];
}

export const toReportDto = (row: Report): ReportDto => ({
  id: row.id,
  incidentId: row.incidentId,
  title: row.title,
  generatedAt: row.generatedAt.toISOString(),
  mode: row.mode,
  summary: row.summary,
  findings: row.findings,
  limitations: row.limitations,
  sources: row.sources,
});
