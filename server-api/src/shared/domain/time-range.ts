export class TimeRange {
  private constructor(
    readonly start: Date,
    readonly end: Date,
  ) {}

  static of(start: Date | string, end: Date | string): TimeRange {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) throw new Error('Invalid time range');
    if (e.getTime() <= s.getTime()) throw new Error('Time range end must be after start');
    return new TimeRange(s, e);
  }

  get durationMinutes(): number {
    return Math.round((this.end.getTime() - this.start.getTime()) / 60000);
  }

  overlaps(other: TimeRange): boolean {
    return this.start < other.end && other.start < this.end;
  }

  contains(at: Date): boolean {
    return at >= this.start && at <= this.end;
  }

  toJSON(): { start_at: string; end_at: string } {
    return { start_at: this.start.toISOString(), end_at: this.end.toISOString() };
  }
}
