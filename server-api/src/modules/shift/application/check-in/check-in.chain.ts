import { GeoPoint } from 'src/shared/domain/geo-point';
import { verifyQrToken } from 'src/shared/utils/qr-token';
import { ShiftDomainError } from '../../domain/errors/shift.errors';
import { ShiftStatus } from '../../domain/shift-status.enum';
import { ShiftState } from '../../domain/shift.aggregate';
import { WorkLocationInfo } from '../ports/shift.ports';

export interface AttendanceContext {
  kind: 'check_in' | 'check_out';
  shift: ShiftState;
  workerId: number;
  now: Date;
  lat: number;
  lng: number;
  accuracyM: number;
  qrToken?: string | null;
  location: WorkLocationInfo;
  config: { earlyMinutes: number; graceMinutes: number; maxAccuracyM: number; qrSecret: string };
}

/** One link of the Chain of Responsibility (docs/ARCHITECTURE.md §10). Throws with a stable code to stop the chain. */
export interface AttendanceCheck {
  readonly name: string;
  check(ctx: AttendanceContext): void;
}

const reject = (code: string, message: string, details?: Record<string, unknown>) => {
  throw new ShiftDomainError(code, message, 'rule', details);
};

export class StateCheck implements AttendanceCheck {
  readonly name = 'state';
  check(ctx: AttendanceContext) {
    const expected = ctx.kind === 'check_in' ? ShiftStatus.ESCROW_FUNDED : ShiftStatus.CHECKED_IN;
    if (ctx.shift.status !== expected || ctx.shift.workerId !== ctx.workerId) {
      reject(ctx.kind === 'check_in' ? 'CHECKIN_NOT_ALLOWED' : 'CHECKOUT_NOT_ALLOWED', 'Not allowed in the current shift state');
    }
  }
}

export class TimeWindowCheck implements AttendanceCheck {
  readonly name = 'time_window';
  check(ctx: AttendanceContext) {
    if (ctx.kind !== 'check_in') return;
    const opens = ctx.shift.startAt.getTime() - ctx.config.earlyMinutes * 60_000;
    const closes = ctx.shift.startAt.getTime() + ctx.config.graceMinutes * 60_000;
    if (ctx.now.getTime() < opens || ctx.now.getTime() > closes) {
      reject('CHECKIN_OUTSIDE_TIME_WINDOW', 'Check-in is only possible shortly before the shift starts', {
        opens_at: new Date(opens).toISOString(),
        closes_at: new Date(closes).toISOString(),
      });
    }
  }
}

export class GpsAccuracyCheck implements AttendanceCheck {
  readonly name = 'gps_accuracy';
  check(ctx: AttendanceContext) {
    if (!Number.isFinite(ctx.accuracyM) || ctx.accuracyM > ctx.config.maxAccuracyM) {
      reject('CHECKIN_GPS_INACCURATE', 'GPS position is not accurate enough', { max_accuracy_m: ctx.config.maxAccuracyM });
    }
  }
}

export class GeofenceCheck implements AttendanceCheck {
  readonly name = 'geofence';
  check(ctx: AttendanceContext) {
    const radius = ctx.location.geofenceRadiusM * (ctx.kind === 'check_out' ? 2 : 1);
    const distance = GeoPoint.of(ctx.lat, ctx.lng).distanceTo(GeoPoint.of(ctx.location.lat, ctx.location.lng));
    if (distance > radius) {
      reject(ctx.kind === 'check_in' ? 'CHECKIN_OUTSIDE_GEOFENCE' : 'CHECKOUT_OUTSIDE_GEOFENCE', 'You are outside the work location', {
        distance_m: Math.round(distance),
        radius_m: radius,
      });
    }
  }
}

export class QrTokenCheck implements AttendanceCheck {
  readonly name = 'qr_token';
  check(ctx: AttendanceContext) {
    if (ctx.kind !== 'check_in' || !ctx.location.qrRequired) return;
    if (!verifyQrToken(ctx.config.qrSecret, ctx.location.qrSecret, ctx.location.id, ctx.qrToken ?? '', ctx.now)) {
      reject('CHECKIN_QR_INVALID', 'The check-in QR code is invalid or expired');
    }
  }
}

/** Ordered chain: state -> time window -> GPS accuracy -> geofence -> QR. */
export class AttendanceChain {
  constructor(private readonly checks: AttendanceCheck[] = [new StateCheck(), new TimeWindowCheck(), new GpsAccuracyCheck(), new GeofenceCheck(), new QrTokenCheck()]) {}

  run(ctx: AttendanceContext): void {
    for (const c of this.checks) c.check(ctx);
  }
}
