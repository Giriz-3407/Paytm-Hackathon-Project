import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeIncidentRow } from '../fixtures';

vi.mock('../../src/modules/incidents/incidents.repository', () => ({
  incidentsRepository: { list: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('../../src/services/realtime.service', () => ({
  realtime: {
    incidentCreated: vi.fn(),
    incidentUpdated: vi.fn(),
    incidentResolved: vi.fn(),
    evidenceAdded: vi.fn(),
    sourceHealth: vi.fn(),
  },
}));

import { incidentsRepository } from '../../src/modules/incidents/incidents.repository';
import { listIncidentsQuery } from '../../src/modules/incidents/incidents.schemas';
import { incidentsService } from '../../src/modules/incidents/incidents.service';
import { realtime } from '../../src/services/realtime.service';

const repo = vi.mocked(incidentsRepository);
const rt = vi.mocked(realtime);

beforeEach(() => vi.resetAllMocks());

describe('incidentsService.list', () => {
  it('maps rows to the frontend shape and builds pagination meta', async () => {
    repo.list.mockResolvedValue({ items: [makeIncidentRow()], total: 120 });
    const query = listIncidentsQuery.parse({ page: '2', pageSize: '50' });

    const { items, meta } = await incidentsService.list(query);

    expect(items[0]).toMatchObject({
      id: 'CL-1',
      location: { city: 'Guwahati', state: 'Assam', district: 'Kamrup' },
      coordinates: [26.14, 91.73],
      sourceCount: 2,
      relatedEvidenceIds: ['ev-1', 'ev-2'],
      firstDetectedAt: '2026-11-22T05:00:00.000Z',
    });
    expect(meta).toEqual({ page: 2, pageSize: 50, total: 120, totalPages: 3 });
  });
});

describe('incidentsService.getById', () => {
  it('throws a 404 AppError when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(incidentsService.getById('nope')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('incidentsService.update', () => {
  it('broadcasts incident:resolved only on the transition into Resolved', async () => {
    repo.findById.mockResolvedValue(makeIncidentRow({ lifecycleStatus: 'Active' }));
    repo.update.mockResolvedValue(makeIncidentRow({ lifecycleStatus: 'Resolved' }));

    await incidentsService.update('CL-1', { lifecycleStatus: 'Resolved' });

    expect(rt.incidentResolved).toHaveBeenCalledTimes(1);
    expect(rt.incidentUpdated).not.toHaveBeenCalled();
  });

  it('broadcasts incident:updated for ordinary edits and for already-resolved incidents', async () => {
    repo.findById.mockResolvedValue(makeIncidentRow({ lifecycleStatus: 'Resolved' }));
    repo.update.mockResolvedValue(makeIncidentRow({ lifecycleStatus: 'Resolved' }));

    await incidentsService.update('CL-1', { lifecycleStatus: 'Resolved' });

    expect(rt.incidentUpdated).toHaveBeenCalledTimes(1);
    expect(rt.incidentResolved).not.toHaveBeenCalled();
  });

  it('stamps lastUpdatedAt on every update', async () => {
    repo.findById.mockResolvedValue(makeIncidentRow());
    repo.update.mockResolvedValue(makeIncidentRow());
    await incidentsService.update('CL-1', { severity: 'Critical' });
    expect(repo.update.mock.calls[0]![1]).toMatchObject({
      severity: 'Critical',
      lastUpdatedAt: expect.any(Date),
    });
  });

  it('returns 404 for an unknown incident without writing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(incidentsService.update('nope', { severity: 'Low' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('listIncidentsQuery', () => {
  it('accepts comma-separated and repeated list parameters', () => {
    expect(listIncidentsQuery.parse({ categories: 'Flood,Fire' }).categories).toEqual(['Flood', 'Fire']);
    expect(listIncidentsQuery.parse({ severities: ['High', 'Low'] }).severities).toEqual(['High', 'Low']);
  });

  it('rejects unknown categories and oversized pages', () => {
    expect(listIncidentsQuery.safeParse({ categories: 'Tsunami' }).success).toBe(false);
    expect(listIncidentsQuery.safeParse({ pageSize: '500' }).success).toBe(false);
  });
});
