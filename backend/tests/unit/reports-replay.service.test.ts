import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReplayEvent, ReplayScenario } from '@prisma/client';
import { makeEvidence, makeIncidentRow } from '../fixtures';

vi.mock('../../src/modules/replay/replay.repository', () => ({
  replayRepository: { listScenarios: vi.fn(), findScenario: vi.fn() },
}));

import { replayRepository } from '../../src/modules/replay/replay.repository';
import { replayService } from '../../src/modules/replay/replay.service';
import { composeReport } from '../../src/modules/reports/reports.service';

describe('composeReport', () => {
  it('summarises evidence and states that no AI was used', () => {
    const report = composeReport(makeIncidentRow(), [
      makeEvidence({ id: 'ev-1', sourceId: 's1', verificationStatus: 'Corroborated' }),
      makeEvidence({ id: 'ev-2', sourceId: 's2', verificationStatus: 'Unverified' }),
    ]);

    expect(report.title).toBe('Guwahati: flood situation brief');
    expect(report.sources).toEqual(['ev-1', 'ev-2']);
    expect(report.findings.join(' ')).toMatch(/2 evidence item\(s\) from 2 source\(s\)/);
    expect(report.limitations.join(' ')).toMatch(/no AI model was used/i);
    expect(report.limitations.join(' ')).toMatch(/not an official emergency alert/i);
  });

  it('does not claim evidence exists when there is none', () => {
    const report = composeReport(makeIncidentRow({ evidence: [] }), []);
    expect(report.findings.join(' ')).toMatch(/No evidence is linked/);
    expect(report.sources).toEqual([]);
  });
});

describe('replayService', () => {
  beforeEach(() => vi.resetAllMocks());

  const scenario = (events: Partial<ReplayEvent>[]) =>
    ({
      id: 'mumbai-2005',
      title: 't',
      description: 'd',
      location: 'Mumbai',
      startTime: new Date('2005-07-26T03:30:00Z'),
      endTime: new Date('2005-07-26T08:30:00Z'),
      dataQualityNotes: 'n',
      evaluation: 'e',
      events: events.map((e, i) => ({
        id: `e${i}`,
        scenarioId: 'mumbai-2005',
        availableAt: new Date('2005-07-26T04:00:00Z'),
        eventType: 'incident',
        payload: {},
        ...e,
      })),
    }) as ReplayScenario & { events: ReplayEvent[] };

  it('forwards asOf to the repository so later events are excluded at the query', async () => {
    vi.mocked(replayRepository.findScenario).mockResolvedValue(scenario([{}]));
    await replayService.getScenario('mumbai-2005', '2005-07-26T04:00:00Z');
    expect(replayRepository.findScenario).toHaveBeenCalledWith(
      'mumbai-2005',
      new Date('2005-07-26T04:00:00Z'),
    );
  });

  it('omits the cutoff when asOf is not provided', async () => {
    vi.mocked(replayRepository.findScenario).mockResolvedValue(scenario([]));
    await replayService.getScenario('mumbai-2005');
    expect(replayRepository.findScenario).toHaveBeenCalledWith('mumbai-2005', undefined);
  });

  it('serialises dates as ISO strings and 404s for unknown scenarios', async () => {
    vi.mocked(replayRepository.findScenario).mockResolvedValueOnce(scenario([{}]));
    const dto = await replayService.getScenario('mumbai-2005');
    expect(dto.startTime).toBe('2005-07-26T03:30:00.000Z');
    expect(dto.events[0]!.availableAt).toBe('2005-07-26T04:00:00.000Z');

    vi.mocked(replayRepository.findScenario).mockResolvedValueOnce(null);
    await expect(replayService.getScenario('nope')).rejects.toMatchObject({ statusCode: 404 });
  });
});
