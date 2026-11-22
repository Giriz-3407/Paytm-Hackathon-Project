import { describe, it, expect } from 'vitest';
import { dateLabel } from '@/lib/utils';
describe('display preferences', () => {
  it('formats the selected date convention and timezone without changing the instant', () => {
    expect(dateLabel('2026-11-22T20:30:00Z', false, 'Asia/Kolkata', 'yyyy-MM-dd')).toBe(
      '2026-11-23',
    );
    expect(dateLabel('2026-11-22T20:30:00Z', false, 'UTC', 'MM/dd/yyyy')).toBe('11/22/2026');
    expect(dateLabel('2026-11-22T20:30:00Z', true, 'Asia/Kolkata')).toContain('IST');
    expect(dateLabel('2026-11-22T20:30:00Z', true, 'UTC')).toContain('UTC');
  });
});
