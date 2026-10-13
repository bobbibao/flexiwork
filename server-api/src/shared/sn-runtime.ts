import configuration from './utils/configuration';

/** Runtime helpers for Shift Network code (reads env at call time, after ConfigModule loaded it). */
export const snConfig = () => configuration();

export const isDevelopment = (): boolean => (process.env.NODE_ENV || 'development') === 'development';

/** 'api' (src/main.ts), 'worker' (src/main.worker.ts) or 'tool' (one-off scripts such as rebuild-projection.ts). */
export const appRole = (): 'api' | 'worker' | 'tool' =>
  process.env.APP_ROLE === 'worker' ? 'worker' : process.env.APP_ROLE === 'tool' ? 'tool' : 'api';

/**
 * Whether this process runs background work (outbox relay, consumers, timer processors).
 * Worker role always; api role only with the in-memory bus (single-process dev); tool role never.
 */
export const runsBackground = (): boolean =>
  appRole() === 'worker' || (appRole() === 'api' && snConfig().MESSAGE_BUS_DRIVER === 'memory');

/** Development-only timer acceleration (docs/ARCHITECTURE.md §5.5). */
export const timerSpeedup = (): number => (isDevelopment() ? Math.max(1, snConfig().SN_TIMER_SPEEDUP) : 1);

export const minutes = (n: number): number => n * 60_000;
export const hours = (n: number): number => n * 3_600_000;

/** For best-effort cleanup promises (`.catch(ignoreError)`). */
export const ignoreError = (): void => {};
