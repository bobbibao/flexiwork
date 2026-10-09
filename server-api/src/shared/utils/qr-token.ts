import { createHmac, timingSafeEqual } from 'crypto';

export const QR_WINDOW_SECONDS = 30;

const windowAt = (date: Date) => Math.floor(date.getTime() / 1000 / QR_WINDOW_SECONDS);

const sign = (globalSecret: string, locationSecret: string, locationId: string, window: number) =>
  createHmac('sha256', `${globalSecret}:${locationSecret}`).update(`${locationId}:${window}`).digest('base64url').slice(0, 16);

/** Rotating check-in token shown on the employer's screen (docs/ARCHITECTURE.md §10). */
export function currentQrToken(globalSecret: string, locationSecret: string, locationId: string, at = new Date()) {
  const window = windowAt(at);
  return {
    token: sign(globalSecret, locationSecret, locationId, window),
    expires_at: new Date((window + 1) * QR_WINDOW_SECONDS * 1000).toISOString(),
  };
}

/** Accepts the current or the previous window. */
export function verifyQrToken(globalSecret: string, locationSecret: string, locationId: string, token: string, at = new Date()): boolean {
  if (!token) return false;
  const window = windowAt(at);
  return [window, window - 1].some((w) => {
    const expected = Buffer.from(sign(globalSecret, locationSecret, locationId, w));
    const given = Buffer.from(String(token));
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
}
