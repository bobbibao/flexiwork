/** An event raised by an aggregate; becomes an EventEnvelope when persisted. */
export interface DomainEvent<P = Record<string, unknown>> {
  type: string;
  version: number;
  payload: P;
  occurredAt: Date;
}

export const domainEvent = <P>(type: string, payload: P, occurredAt: Date = new Date(), version = 1): DomainEvent<P> => ({
  type,
  version,
  payload,
  occurredAt,
});
