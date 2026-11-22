import { describe, it, expect } from 'vitest';
import { mockIncidents, DEMO_NOW } from '@/data/mock-data';
import { filterIncidents, rangeStart, severityRank } from '@/features/incidents/filter';
describe('incident queries', () => {
  it('searches location and ID case insensitively and composes filters', () => {
    expect(
      filterIncidents(mockIncidents, {
        search: 'guwahati',
        categories: ['Flood'],
        severities: ['Critical'],
      }),
    ).toHaveLength(1);
    expect(filterIncidents(mockIncidents, { search: 'cl-2401' })[0].location.city).toBe('Guwahati');
    expect(
      filterIncidents(mockIncidents, { search: 'guwahati', categories: ['Fire'] }),
    ).toHaveLength(0);
  });
  it('sorts severity without mutating the input', () => {
    const before = mockIncidents.map((i) => i.id);
    const data = filterIncidents(mockIncidents, { sort: 'severity' });
    expect(data[0].severity).toBe('Critical');
    expect(data.at(-1)?.severity).toBe('Unknown');
    expect(
      data.every((i, n) => !n || severityRank[i.severity] >= severityRank[data[n - 1].severity]),
    ).toBe(true);
    expect(mockIncidents.map((i) => i.id)).toEqual(before);
  });
  it('filters dates against a fixed reference and handles multiple selections', () => {
    expect(rangeStart(1, DEMO_NOW)).toBe('2026-11-21T06:30:00.000Z');
    expect(
      filterIncidents(mockIncidents, { from: rangeStart(1, DEMO_NOW), to: DEMO_NOW }),
    ).toHaveLength(10);
    expect(filterIncidents(mockIncidents, { categories: ['Flood', 'Fire'] })).toHaveLength(6);
  });
});
