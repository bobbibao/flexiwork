/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { AttendanceChain, AttendanceContext } from './check-in.chain';
import { ShiftStatus } from '../../domain/shift-status.enum';
import { currentQrToken } from 'src/shared/utils/qr-token';

const start = new Date('2026-10-14T11:00:00Z');
const base = (over: Partial<AttendanceContext> = {}): AttendanceContext => ({
  kind: 'check_in',
  shift: { status: ShiftStatus.ESCROW_FUNDED, workerId: 7, startAt: start } as any,
  workerId: 7,
  now: new Date(start.getTime() - 10 * 60_000),
  lat: 10.7769,
  lng: 106.7009,
  accuracyM: 20,
  qrToken: null,
  location: { id: 'loc', lat: 10.7769, lng: 106.7009, geofenceRadiusM: 150, qrRequired: false, qrSecret: 'ls' } as any,
  config: { earlyMinutes: 30, graceMinutes: 15, maxAccuracyM: 100, qrSecret: 'gs' },
  ...over,
});
const chain = new AttendanceChain();
const codeOf = (ctx: AttendanceContext) => {
  try {
    chain.run(ctx);
    return 'OK';
  } catch (e: any) {
    return e.code;
  }
};

describe('Check-in chain (ARCHITECTURE §10)', () => {
  it('passes inside the geofence and time window', () => expect(codeOf(base())).toBe('OK'));
  it('rejects outside the geofence (~2 km away)', () => expect(codeOf(base({ lat: 10.795, lng: 106.7009 }))).toBe('CHECKIN_OUTSIDE_GEOFENCE'));
  it('rejects too early and too late', () => {
    expect(codeOf(base({ now: new Date(start.getTime() - 31 * 60_000) }))).toBe('CHECKIN_OUTSIDE_TIME_WINDOW');
    expect(codeOf(base({ now: new Date(start.getTime() + 16 * 60_000) }))).toBe('CHECKIN_OUTSIDE_TIME_WINDOW');
  });
  it('rejects inaccurate GPS', () => expect(codeOf(base({ accuracyM: 500 }))).toBe('CHECKIN_GPS_INACCURATE'));
  it('rejects the wrong worker / state', () => expect(codeOf(base({ workerId: 8 }))).toBe('CHECKIN_NOT_ALLOWED'));
  it('requires a valid rotating QR token when the location demands it', () => {
    const location = { id: 'loc', lat: 10.7769, lng: 106.7009, geofenceRadiusM: 150, qrRequired: true, qrSecret: 'ls' } as any;
    const now = new Date(start.getTime() - 5 * 60_000);
    expect(codeOf(base({ location, now, qrToken: 'nope' }))).toBe('CHECKIN_QR_INVALID');
    const { token } = currentQrToken('gs', 'ls', 'loc', now);
    expect(codeOf(base({ location, now, qrToken: token }))).toBe('OK');
  });
});
