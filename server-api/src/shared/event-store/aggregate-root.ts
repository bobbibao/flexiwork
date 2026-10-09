import { DomainEvent, domainEvent } from '../events/domain-event';

/** Base class for event-sourced aggregates (docs/ARCHITECTURE.md §7.2). Pure TypeScript, no framework imports. */
export abstract class AggregateRoot {
  /** Number of events already persisted for this stream. */
  version = 0;
  private pending: DomainEvent[] = [];

  protected constructor(readonly id: string) {}

  /** Mutates state from one event. Must not validate: events are facts. */
  protected abstract when(event: DomainEvent): void;

  /** Tenant (employer company) for the envelope; null for worker-only facts. */
  abstract tenantId(): number | null;

  protected raise<P>(type: string, payload: P, at: Date = new Date()): void {
    const event = domainEvent(type, payload, at) as unknown as DomainEvent;
    this.when(event);
    this.pending.push(event);
  }

  replay(events: DomainEvent[]): void {
    for (const e of events) {
      this.when(e);
      this.version += 1;
    }
  }

  get pendingEvents(): readonly DomainEvent[] {
    return this.pending;
  }

  /** Called by the repository after a successful commit. */
  markCommitted(): void {
    this.version += this.pending.length;
    this.pending = [];
  }

  /** Optional snapshot support. */
  toSnapshot?(): Record<string, unknown>;
  restoreSnapshot?(state: Record<string, unknown>): void;
}
