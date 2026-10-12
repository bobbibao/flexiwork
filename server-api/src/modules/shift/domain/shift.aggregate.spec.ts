import { GeoPoint } from 'src/shared/domain/geo-point';
import { Shift, PostShiftInput } from './shift.aggregate';
import { ShiftStatus as S } from './shift-status.enum';
import { PricingPolicy } from './policies/pricing.policy';
import { CompletionPolicy } from './policies/completion.policy';
import { CancellationPolicy } from './policies/cancellation.policy';
import { ShiftDomainError } from './errors/shift.errors';

const pricing = new PricingPolicy();
const completion = new CompletionPolicy();
const cancellation = new CancellationPolicy(12, 30);
const at = (iso: string) => new Date(`${iso}+07:00`);
const WORKER = 42;

function posted(now = at('2026-10-14T08:00:00')): Shift {
  const input: PostShiftInput = {
    jobRef: 'job-1',
    companyId: 7,
    companyName: 'Nhà hàng Phố Cổ',
    workLocationId: 'loc-1',
    locationName: 'Quận 1',
    title: 'Phục vụ bàn',
    description: null,
    skillCode: 'phuc_vu',
    startAt: at('2026-10-14T18:00:00'),
    endAt: at('2026-10-14T22:00:00'),
    hourlyVnd: 40_000,
    dispatchMode: 'sequential',
    location: GeoPoint.of(10.7769, 106.7009),
    address: null,
    provinceCode: '79',
    wardCode: null,
    postedBy: 1,
    platformFeePct: 10,
    minLeadMinutes: 60,
    minHourlyVnd: 20_000,
  };
  return Shift.post('shift-1', input, pricing, now);
}

/** Simulates persistence: replay committed events into a fresh aggregate. */
function reload(shift: Shift): Shift {
  const events = [...shift.pendingEvents];
  const fresh = new Shift(shift.id);
  fresh.replay(events);
  return fresh;
}

const types = (s: Shift) => s.pendingEvents.map((e) => e.type);

function fundedShift(): Shift {
  const s = posted();
  s.offer([WORKER], 'direct', at('2026-10-14T08:15:00'), 'employer', at('2026-10-14T08:01:00'));
  s.accept(WORKER, at('2026-10-14T08:05:00'));
  s.recordEscrowFunded('j1', 176_000, at('2026-10-14T08:05:01'));
  return s;
}

describe('Shift aggregate (given / when / then)', () => {
  it('prices the shift and holds gross + fee', () => {
    const s = posted();
    expect(s.state.estimatedGrossVnd).toBe(160_000);
    expect(s.state.platformFeeVnd).toBe(16_000);
    expect(s.state.escrowAmountVnd).toBe(176_000);
  });

  it('rejects a shift starting too soon', () => {
    expect(() => posted(at('2026-10-14T17:30:00'))).toThrow(ShiftDomainError);
  });

  it('happy path: posted -> matched -> accepted -> funded -> in -> out -> completed -> paid -> rated', () => {
    const s = fundedShift();
    s.checkIn(WORKER, { at: at('2026-10-14T17:55:00').toISOString(), lat: 10.7769, lng: 106.7009, accuracy_m: 15, method: 'gps' }, at('2026-10-14T17:55:00'));
    s.checkOut(WORKER, { lat: 10.7769, lng: 106.7009 }, false, at('2026-10-14T22:00:00'));
    expect(s.state.workedMinutes).toBe(245);
    s.confirmCompletion(null, false, completion, at('2026-10-14T22:30:00'));
    expect(s.state.approvedMinutes).toBe(240);
    expect(s.state.grossVnd).toBe(160_000);
    expect(s.state.feeVnd).toBe(16_000);
    s.recordPaymentReleased({ journal_id: 'j2', gross_vnd: 160_000, pit_vnd: 0, net_vnd: 160_000, fee_vnd: 16_000, refund_vnd: 0 }, at('2026-10-14T22:30:01'));
    s.rate('employer', 1, 5, ['dung_gio'], null, at('2026-10-14T23:00:00'));
    expect(s.status).toBe(S.PAID);
    s.rate('worker', WORKER, 4, [], 'Tốt', at('2026-10-14T23:05:00'));
    expect(s.status).toBe(S.RATED);
    expect(types(s)).toEqual([
      'shift.posted',
      'shift.offered',
      'shift.accepted',
      'shift.escrow_funded',
      'shift.worker_checked_in',
      'shift.worker_checked_out',
      'shift.completed',
      'shift.paid',
      'shift.rated',
      'shift.rated',
      'shift.ratings_closed',
    ]);
    // replaying the same events rebuilds the same state
    expect(reload(s).toView()).toEqual({ ...s.toView(), version: s.pendingEvents.length });
  });

  it('only an offered worker can accept; declining the last offer reopens the shift', () => {
    const s = posted();
    s.offer([WORKER], 'direct', at('2026-10-14T08:15:00'), 'employer', at('2026-10-14T08:01:00'));
    expect(() => s.accept(99, at('2026-10-14T08:02:00'))).toThrow('not offered');
    s.declineOffer(WORKER, at('2026-10-14T08:03:00'));
    expect(s.status).toBe(S.POSTED);
    expect(() => s.offer([WORKER], 'direct', at('2026-10-14T08:20:00'), 'employer', at('2026-10-14T08:04:00'))).toThrow(ShiftDomainError);
  });

  it('no-show -> rematch excludes the no-show worker', () => {
    const s = fundedShift();
    s.recordNoShow(at('2026-10-14T18:15:00'));
    expect(s.status).toBe(S.NO_SHOW);
    s.rematch('system', at('2026-10-14T18:16:00'));
    expect(s.status).toBe(S.POSTED);
    expect(s.state.workerId).toBeNull();
    expect(s.state.excludedWorkerIds).toContain(WORKER);
    expect(s.state.escrowHeld).toBe(true);
  });

  it('dispute -> ops resolves with partial pay (3 h of 4 h)', () => {
    const s = fundedShift();
    s.checkIn(WORKER, { at: at('2026-10-14T18:00:00').toISOString(), lat: 0, lng: 0, accuracy_m: 10, method: 'gps' }, at('2026-10-14T18:00:00'));
    s.checkOut(WORKER, { lat: null, lng: null }, false, at('2026-10-14T22:00:00'));
    s.dispute({ reason_code: 'left_early', note: 'Về sớm 1 giờ', claimed_minutes: 180 }, at('2026-10-14T22:10:00'));
    expect(s.status).toBe(S.DISPUTED);
    expect(() => s.confirmCompletion(null, false, completion, at('2026-10-14T22:11:00'))).toThrow('not allowed');
    s.resolveDispute('pay', 180, null, completion, at('2026-10-15T09:00:00'));
    expect(s.status).toBe(S.COMPLETED);
    expect(s.state.grossVnd).toBe(120_000);
    expect(s.state.feeVnd).toBe(12_000);
  });

  it('late employer cancellation pays 30 % compensation; early cancellation is free', () => {
    const late = fundedShift();
    late.cancel('employer', 'employer', null, cancellation, at('2026-10-14T10:00:00'));
    const p: any = late.pendingEvents[late.pendingEvents.length - 1].payload;
    expect(late.status).toBe(S.CANCELLED);
    expect(p.escrow_held).toBe(true);
    expect(p.compensation_gross_vnd).toBe(48_000);

    const early = posted();
    early.cancel('employer', 'employer', null, cancellation, at('2026-10-14T08:30:00'));
    expect((early.pendingEvents[1].payload as any).compensation_gross_vnd).toBe(0);
  });

  it('auto checkout uses the scheduled end and auto-confirm approves worked time', () => {
    const s = fundedShift();
    s.checkIn(WORKER, { at: at('2026-10-14T18:30:00').toISOString(), lat: 0, lng: 0, accuracy_m: 10, method: 'gps' }, at('2026-10-14T18:30:00'));
    s.checkOut(null, { lat: null, lng: null }, true, at('2026-10-15T00:00:00'));
    expect(s.state.workedMinutes).toBe(210);
    expect(s.state.autoCheckedOut).toBe(true);
    s.confirmCompletion(null, true, completion, at('2026-10-15T12:00:00'));
    expect(s.state.approvedMinutes).toBe(210);
  });
});
