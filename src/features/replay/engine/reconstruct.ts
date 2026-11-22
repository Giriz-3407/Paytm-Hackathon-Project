import { Incident, ReplayEvent, ReplayReport } from '@/types/domain';
/** Rebuild from eligible events on every seek. Future state can never survive a rewind. */
export function reconstruct(events: ReplayEvent[], virtualTime: number) {
  const incidents = new Map<string, Incident>();
  const evidence: ReplayReport[] = [];
  const processed = new Set<string>();
  const released: ReplayEvent[] = [];
  for (const e of [...events].sort(
    (a, b) => Date.parse(a.availableAt) - Date.parse(b.availableAt),
  )) {
    if (Date.parse(e.availableAt) > virtualTime || processed.has(e.id)) continue;
    processed.add(e.id);
    released.push(e);
    if (e.eventType === 'incident') incidents.set(e.payload.id, structuredClone(e.payload));
    if (e.eventType === 'update') {
      const i = incidents.get(e.payload.incidentId);
      if (i) incidents.set(i.id, { ...i, ...e.payload, lastUpdatedAt: e.availableAt });
    }
    if (e.eventType === 'evidence') {
      evidence.push(e.payload);
      const i = incidents.get(e.payload.incidentId);
      if (i)
        incidents.set(i.id, {
          ...i,
          sourceCount: i.sourceCount + 1,
          relatedEvidenceIds: [...i.relatedEvidenceIds, e.payload.id],
          lastUpdatedAt: e.availableAt,
        });
    }
  }
  return { incidents: [...incidents.values()], evidence, released };
}
