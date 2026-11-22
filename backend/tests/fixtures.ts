import type { Evidence } from '@prisma/client';
import type { IncidentRow } from '../src/modules/incidents/incidents.types';

export const makeIncidentRow = (overrides: Partial<IncidentRow> = {}): IncidentRow => ({
  id: 'CL-1',
  title: 'River levels rise',
  description: 'desc',
  category: 'Flood',
  severity: 'High',
  evidenceStatus: 'Developing',
  lifecycleStatus: 'Active',
  city: 'Guwahati',
  state: 'Assam',
  district: 'Kamrup',
  latitude: 26.14,
  longitude: 91.73,
  firstDetectedAt: new Date('2026-11-22T05:00:00Z'),
  lastUpdatedAt: new Date('2026-11-22T06:00:00Z'),
  summary: 'summary',
  mode: 'demo',
  createdAt: new Date('2026-11-22T05:00:00Z'),
  evidence: [{ id: 'ev-1' }, { id: 'ev-2' }],
  ...overrides,
});

export const makeEvidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  id: 'ev-1',
  incidentId: 'CL-1',
  sourceId: 's1',
  title: 'Report',
  sourceUrl: null,
  publishedAt: new Date('2026-11-22T05:00:00Z'),
  availableAt: new Date('2026-11-22T05:00:00Z'),
  ingestedAt: new Date('2026-11-22T05:01:00Z'),
  content: 'text',
  verificationStatus: 'Unverified',
  ...overrides,
});
