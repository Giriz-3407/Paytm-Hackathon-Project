import { describe, it, expect } from 'vitest';
import { VirtualClock } from '@/features/replay/engine/clock';
import { reconstruct } from '@/features/replay/engine/reconstruct';
import { replayScenarios } from '@/data/replay-scenarios';
describe('virtual clock', () => {
  it('uses actual elapsed time despite irregular render intervals', () => {
    let real = 0;
    const c = new VirtualClock(1000, 100000, () => real);
    c.setSpeed(10);
    c.play();
    real = 3412;
    expect(c.time).toBe(35120);
  });
  it('freezes on pause and preserves continuity across speed changes and resume', () => {
    let real = 0;
    const c = new VirtualClock(0, 1000000, () => real);
    c.setSpeed(10);
    c.play();
    real = 500;
    c.pause();
    real = 9000;
    expect(c.time).toBe(5000);
    c.play();
    real = 9500;
    expect(c.time).toBe(10000);
    c.setSpeed(60);
    expect(c.time).toBe(10000);
    real = 10000;
    expect(c.time).toBe(40000);
  });
  it('seeks, clamps, completes, and resets', () => {
    let real = 0;
    const c = new VirtualClock(100, 1000, () => real);
    c.seek(-10);
    expect(c.time).toBe(100);
    c.seek(500);
    expect(c.time).toBe(500);
    c.play();
    real = 100;
    expect(c.status).toBe('completed');
    expect(c.time).toBe(1000);
    c.reset();
    expect(c.status).toBe('ready');
    expect(c.time).toBe(100);
    expect(() => c.setSpeed(0)).toThrow();
  });
});
describe('event processing', () => {
  const s = replayScenarios[0];
  const start = Date.parse(s.startTime);
  it('releases no information before availability, even after publication', () => {
    const r = reconstruct(s.events, start + 21 * 60000);
    expect(r.incidents).toHaveLength(1);
    expect(r.evidence).toHaveLength(0);
    expect(r.incidents[0].severity).toBe('Medium');
  });
  it('includes boundary events and processes all eligible events in chronological order', () => {
    const r = reconstruct([...s.events].reverse(), start + 150 * 60000);
    expect(r.released).toHaveLength(6);
    expect(r.incidents[0].severity).toBe('Critical');
    expect(r.evidence).toHaveLength(2);
    expect(r.released.map((e) => e.availableAt)).toEqual(
      [...r.released.map((e) => e.availableAt)].sort(),
    );
  });
  it('prevents duplicate processing and duplicate evidence', () => {
    const r = reconstruct([...s.events, ...s.events], Date.parse(s.endTime));
    expect(r.released).toHaveLength(s.events.length);
    expect(r.incidents[0].sourceCount).toBe(2);
    expect(r.evidence).toHaveLength(2);
  });
  it('reconstructs on backward seek without leaking future incidents, evidence, or severity', () => {
    const future = reconstruct(s.events, Date.parse(s.endTime));
    const past = reconstruct(s.events, start + 30 * 60000);
    expect(future.incidents).toHaveLength(2);
    expect(past.incidents).toHaveLength(1);
    expect(past.incidents[0].severity).toBe('Medium');
    expect(past.evidence).toHaveLength(1);
    expect(past.incidents[0].sourceCount).toBe(1);
    expect(s.events[0].eventType === 'incident' && s.events[0].payload.sourceCount).toBe(0);
  });
});
