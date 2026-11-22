/** Accurate elapsed-time engine, independent of rendering and timer cadence. */
export class VirtualClock {
  private anchorReal = 0;
  private anchorVirtual: number;
  private running = false;
  speed = 600;
  constructor(
    readonly start: number,
    readonly end: number,
    private now: () => number = () => performance.now(),
  ) {
    this.anchorVirtual = start;
  }
  get time() {
    return Math.min(
      this.end,
      this.anchorVirtual + (this.running ? (this.now() - this.anchorReal) * this.speed : 0),
    );
  }
  get status(): 'ready' | 'playing' | 'paused' | 'completed' {
    return this.time >= this.end
      ? 'completed'
      : this.running
        ? 'playing'
        : this.time === this.start
          ? 'ready'
          : 'paused';
  }
  play() {
    if (this.time >= this.end) return;
    this.anchorVirtual = this.time;
    this.anchorReal = this.now();
    this.running = true;
  }
  pause() {
    this.anchorVirtual = this.time;
    this.running = false;
  }
  setSpeed(speed: number) {
    if (!Number.isFinite(speed) || speed <= 0) throw new Error('Speed must be positive');
    this.anchorVirtual = this.time;
    this.anchorReal = this.now();
    this.speed = speed;
  }
  seek(time: number) {
    this.anchorVirtual = Math.max(this.start, Math.min(this.end, time));
    this.anchorReal = this.now();
  }
  reset() {
    this.running = false;
    this.seek(this.start);
  }
}
