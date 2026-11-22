import { Incident, IncidentFilters, Severity } from '@/types/domain';
import { subDays } from 'date-fns';
export const severityRank: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Unknown: 4,
};
export function filterIncidents(items: Incident[], f: IncidentFilters = {}) {
  const search = f.search?.trim().toLowerCase();
  return items
    .filter(
      (i) =>
        (!search ||
          [i.title, i.id, i.location.city, i.location.state].some((v) =>
            v.toLowerCase().includes(search),
          )) &&
        (!f.categories?.length || f.categories.includes(i.category)) &&
        (!f.severities?.length || f.severities.includes(i.severity)) &&
        (!f.evidence || i.evidenceStatus === f.evidence) &&
        (!f.state || i.location.state === f.state) &&
        (!f.district || i.location.district === f.district) &&
        (!f.from || Date.parse(i.firstDetectedAt) >= Date.parse(f.from)) &&
        (!f.to || Date.parse(i.firstDetectedAt) <= Date.parse(f.to)) &&
        (!f.sourceId || i.relatedEvidenceIds.some((id) => id.endsWith(`-${f.sourceId}`))),
    )
    .sort((a, b) =>
      f.sort === 'severity'
        ? severityRank[a.severity] - severityRank[b.severity]
        : Date.parse(f.sort === 'updated' ? b.lastUpdatedAt : b.firstDetectedAt) -
          Date.parse(f.sort === 'updated' ? a.lastUpdatedAt : a.firstDetectedAt),
    );
}
export function rangeStart(days: number, reference: string) {
  return subDays(new Date(reference), days).toISOString();
}
