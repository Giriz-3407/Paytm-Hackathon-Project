import { describe, expect, it } from 'vitest';
import { normaliseResults, parseSerpDate } from '../../src/services/serpapi.service';

describe('parseSerpDate', () => {
  it('parses SerpApi date strings as UTC', () => {
    expect(parseSerpDate({ date: '11/22/2026, 06:30 PM, +0000 UTC' })?.toISOString()).toBe(
      '2026-11-22T18:30:00.000Z',
    );
    expect(parseSerpDate({ date: '11/22/2026, 12:05 AM, +0000 UTC' })?.toISOString()).toBe(
      '2026-11-22T00:05:00.000Z',
    );
  });

  it('prefers iso_date and returns null for unparseable values', () => {
    expect(parseSerpDate({ iso_date: '2026-11-22T01:02:03Z', date: 'yesterday' })?.toISOString()).toBe(
      '2026-11-22T01:02:03.000Z',
    );
    expect(parseSerpDate({ date: 'yesterday' })).toBeNull();
  });
});

describe('normaliseResults', () => {
  it('flattens nested stories and drops unsafe or incomplete items', () => {
    const items = normaliseResults([
      { title: 'A', link: 'https://x.com/a', source: { name: 'X' } },
      { title: 'B', link: 'javascript:alert(1)' },
      { title: 'C' },
      {
        title: 'Parent',
        link: 'https://x.com/p',
        stories: [{ title: 'Child', link: 'https://y.com/c', source: { name: 'Y' } }],
      },
    ]);
    expect(items.map((i) => i.title)).toEqual(['A', 'Parent', 'Child']);
    expect(items[2]).toMatchObject({ publisher: 'Y' });
    expect(items[1]!.publisher).toBe('Unknown publisher');
  });
});
