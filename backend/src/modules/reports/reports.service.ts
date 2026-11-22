import { randomBytes } from 'node:crypto';
import type { Evidence } from '@prisma/client';
import { AppError } from '../../utils/app-error';
import { buildMeta } from '../../utils/pagination';
import { evidenceRepository } from '../evidence/evidence.repository';
import { incidentsRepository } from '../incidents/incidents.repository';
import type { IncidentRow } from '../incidents/incidents.types';
import type { ListReportsQuery } from './reports.schemas';
import { reportsRepository } from './reports.repository';
import { toReportDto, type ReportDto } from './reports.types';

/**
 * Builds report text from stored data using a fixed template. No AI model is involved,
 * and the report says so. Exported separately so it can be unit-tested without a database.
 */
export function composeReport(incident: IncidentRow, evidence: Evidence[]) {
  const sourceIds = new Set(evidence.map((e) => e.sourceId));
  const statusCounts = evidence.reduce<Record<string, number>>((acc, e) => {
    acc[e.verificationStatus] = (acc[e.verificationStatus] ?? 0) + 1;
    return acc;
  }, {});
  const breakdown = Object.entries(statusCounts)
    .map(([status, count]) => `${count} ${status.toLowerCase()}`)
    .join(', ');

  const findings = [
    `Records place the situation in ${incident.city}, ${incident.state} (${incident.district} district).`,
    `Recorded assessment: ${incident.severity} severity; ${incident.evidenceStatus.toLowerCase()} evidence; lifecycle ${incident.lifecycleStatus.toLowerCase()}.`,
    evidence.length
      ? `${evidence.length} evidence item(s) from ${sourceIds.size} source(s) are linked (${breakdown}).`
      : 'No evidence is linked to this incident yet.',
  ];

  const limitations = [
    'Assembled from stored records by a fixed template; no AI model was used.',
    'Severity and evidence status are recorded values, not independent verification.',
    'Not an official emergency alert. Follow guidance from official authorities.',
  ];

  return {
    title: `${incident.city}: ${incident.category.toLowerCase()} situation brief`,
    summary: incident.summary,
    findings,
    limitations,
    sources: evidence.map((e) => e.id),
  };
}

export const reportsService = {
  async list(query: ListReportsQuery) {
    const { items, total } = await reportsRepository.list(query);
    return { items: items.map(toReportDto), meta: buildMeta(query, total) };
  },

  async getById(id: string): Promise<ReportDto> {
    const row = await reportsRepository.findById(id);
    if (!row) throw AppError.notFound(`Report ${id} not found`);
    return toReportDto(row);
  },

  async generate(incidentId: string): Promise<ReportDto> {
    const incident = await incidentsRepository.findById(incidentId);
    if (!incident) throw AppError.notFound(`Incident ${incidentId} not found`);
    const evidence = await evidenceRepository.listByIncident(incidentId);

    const row = await reportsRepository.create({
      id: `RPT-${randomBytes(4).toString('hex').toUpperCase()}`,
      incidentId,
      generatedAt: new Date(),
      mode: incident.mode,
      ...composeReport(incident, evidence),
    });
    return toReportDto(row);
  },
};
