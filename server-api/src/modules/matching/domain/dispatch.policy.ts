/** How many ranked candidates receive the offer (docs/ARCHITECTURE.md §9.4). */
export class DispatchPolicy {
  constructor(private readonly broadcastSize = 5) {}

  pick<T>(mode: 'sequential' | 'broadcast', ranked: T[]): T[] {
    return mode === 'broadcast' ? ranked.slice(0, this.broadcastSize) : ranked.slice(0, 1);
  }
}
