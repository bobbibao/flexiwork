export class ConcurrencyError extends Error {
  constructor(
    readonly streamId: string,
    readonly expectedVersion: number,
  ) {
    super(`Stream ${streamId} was modified concurrently (expected version ${expectedVersion})`);
  }
}
