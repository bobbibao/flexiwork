/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { randomUUID } from 'crypto';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { ConsumeEvents } from 'src/shared/messaging/consume-events.decorator';
import { EventEnvelope } from 'src/shared/events/event-envelope';
import { TOPICS } from 'src/shared/contracts/events/topics';
import { SHIFT_EVENTS as E } from 'src/shared/contracts/events/shift.events';
import { WALLET_EVENTS as W } from 'src/shared/contracts/events/wallet.events';
import { EXCEPTION_EVENTS as X } from 'src/shared/contracts/events/exception.events';
import { TimerHandler } from 'src/shared/timers/timer-handler.decorator';
import { ShiftRepository } from 'src/modules/shift/application/shift.repository';
import { ChannelName, Delivery, NOTIFICATION_CHANNELS, NotificationChannel } from '../channels/notification-channel';
import { formatVnd, formatVnDateTime, renderTemplate } from '../constants/notification-templates.vi';

interface Intent {
  userIds: number[];
  template: string;
  vars: Record<string, string | number | null>;
  channels: ChannelName[];
  data: Record<string, unknown>;
}

const PUSH: ChannelName[] = ['in_app', 'web_push', 'fcm'];
const PUSH_EMAIL: ChannelName[] = ['in_app', 'web_push', 'fcm', 'email'];
const IN_APP: ChannelName[] = ['in_app'];

/**
 * Event -> rule -> recipients -> channel strategies (docs/ARCHITECTURE.md §11.1).
 * Notification rows and deliveries are written in the consumer's inbox transaction; sends happen after commit.
 * Deliveries are unique per (event_id, user_id, channel), so a replayed event never notifies twice.
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly shifts: ShiftRepository,
    @Inject(NOTIFICATION_CHANNELS) private readonly channels: NotificationChannel[],
  ) {}

  @ConsumeEvents({ group: 'sn-notification', topics: [TOPICS.SHIFT, TOPICS.WALLET, TOPICS.EXCEPTION] })
  async on(env: EventEnvelope, t: Transaction): Promise<void> {
    const intents = await this.rules(env, t);
    for (const intent of intents) await this.dispatch(env.event_id, intent, t);
  }

  @TimerHandler('shift.check_in_reminder')
  async onCheckInReminder(p: { shift_id: string }) {
    const shift = await this.shifts.load(p.shift_id);
    if (!shift || shift.status !== 'ESCROW_FUNDED' || !shift.state.workerId) return;
    const eventId = uuidFrom(`reminder:${p.shift_id}:${shift.version}`);
    await this.uow.run(async (t) => this.dispatch(eventId, { userIds: [shift.state.workerId!], template: 'check_in_reminder', vars: this.shiftVars(shift.state, p.shift_id), channels: PUSH, data: { shift_id: p.shift_id } }, t));
  }

  private shiftVars(s: any, id: string) {
    return {
      shift_id: id,
      title: s.title,
      location: s.locationName ?? s.address ?? '',
      start: formatVnDateTime(s.startAt),
      pay: formatVnd(s.estimatedGrossVnd),
    };
  }

  private async rules(env: EventEnvelope, t: Transaction): Promise<Intent[]> {
    const p = env.payload;
    const shiftId = env.stream_type === 'shift' ? env.stream_id : p.shift_id;
    const needsShift = env.stream_type === 'shift' || !!p.shift_id;
    const shift = needsShift && shiftId ? await this.shifts.load(shiftId, t) : null;
    const s = shift?.state;
    const vars = s ? this.shiftVars(s, shiftId) : {};
    const employers = async (companyId: number) => this.employerUsers(companyId, t);

    switch (env.type) {
      case E.OFFERED:
        return [{ userIds: p.worker_ids, template: 'shift_offered', vars: { ...vars, expires: formatVnDateTime(p.expires_at) }, channels: PUSH, data: { shift_id: shiftId } }];
      case E.ACCEPTED:
        return [{ userIds: await employers(s!.companyId), template: 'shift_accepted', vars: { ...vars, worker: await this.workerName(p.worker_id, t) }, channels: PUSH, data: { shift_id: shiftId } }];
      case W.ESCROW_HOLD_FAILED:
        return [{ userIds: await employers(p.company_id), template: 'escrow_topup_needed', vars: { ...vars, amount: formatVnd(p.amount_vnd) }, channels: PUSH_EMAIL, data: { shift_id: shiftId } }];
      case E.ESCROW_FUNDED:
        return s?.workerId ? [{ userIds: [s.workerId], template: 'shift_confirmed', vars, channels: PUSH, data: { shift_id: shiftId } }] : [];
      case E.NO_SHOW_RECORDED:
        return [
          { userIds: await employers(s!.companyId), template: 'no_show', vars, channels: PUSH, data: { shift_id: shiftId } },
          { userIds: [p.worker_id], template: 'no_show_worker', vars, channels: PUSH, data: { shift_id: shiftId } },
        ];
      case E.WORKER_CHECKED_OUT:
        return [{ userIds: await employers(s!.companyId), template: 'confirm_completion', vars: { ...vars, worker: await this.workerName(p.worker_id, t) }, channels: PUSH, data: { shift_id: shiftId } }];
      case E.PAID:
        return s?.workerId ? [{ userIds: [s.workerId], template: 'payment_received', vars: { ...vars, net: formatVnd(p.net_vnd) }, channels: PUSH, data: { shift_id: shiftId } }] : [];
      case E.CANCELLED: {
        const list: Intent[] = [];
        if (p.worker_id) list.push({ userIds: [p.worker_id], template: 'shift_cancelled', vars, channels: PUSH, data: { shift_id: shiftId } });
        if (p.reason !== 'employer') list.push({ userIds: await employers(s!.companyId), template: 'shift_cancelled', vars, channels: PUSH, data: { shift_id: shiftId } });
        return list;
      }
      case E.EXPIRED:
        return [{ userIds: await employers(s!.companyId), template: 'shift_expired', vars, channels: PUSH, data: { shift_id: shiftId } }];
      case W.TOPUP_SUCCEEDED:
      case W.TOPUP_FAILED:
        return [{ userIds: await employers(p.company_id), template: env.type === W.TOPUP_SUCCEEDED ? 'topup_succeeded' : 'topup_failed', vars: { amount: formatVnd(p.amount_vnd) }, channels: IN_APP, data: { intent_id: p.intent_id } }];
      case W.PAYOUT_SETTLED:
      case W.PAYOUT_FAILED:
        return [{ userIds: [p.worker_id], template: env.type === W.PAYOUT_SETTLED ? 'payout_settled' : 'payout_failed', vars: { amount: formatVnd(p.amount_vnd) }, channels: PUSH, data: { intent_id: p.intent_id } }];
      case X.CASE_OPENED: {
        const ops = await this.uow.select<{ id: number }>(`SELECT id FROM users WHERE role = 'ops' AND is_active = true AND deleted_at IS NULL`, {}, t);
        return [
          {
            userIds: ops.map((o) => o.id),
            template: 'exception_opened',
            vars: { case_id: p.case_id, severity: p.severity, summary: p.summary ?? p.type },
            channels: p.severity === 'critical' ? PUSH_EMAIL : IN_APP,
            data: { case_id: p.case_id },
          },
        ];
      }
      default:
        return [];
    }
  }

  private async dispatch(eventId: string, intent: Intent, t: Transaction) {
    const { title, body, url } = renderTemplate(intent.template, intent.vars);
    const userIds = [...new Set(intent.userIds)].filter(Boolean);
    if (!userIds.length) return;
    const users = await this.uow.select<{ id: number; email: string | null; phone: string | null; channels: any }>(
      `SELECT u.id, u.email, u.phone, p.channels FROM users u LEFT JOIN notification_preferences p ON p.user_id = u.id WHERE u.id IN (:ids)`,
      { ids: userIds },
      t,
    );
    const sends: Array<{ channel: NotificationChannel; delivery: Delivery; deliveryId: number }> = [];
    for (const u of users) {
      const notificationId = randomUUID();
      const inserted = await this.uow.execute(
        `INSERT INTO notification_deliveries (event_id, user_id, channel, notification_id, status, created_at, updated_at)
         VALUES (:eventId, :userId, 'in_app', :nid, 'sent', now(), now()) ON CONFLICT DO NOTHING RETURNING id`,
        { eventId, userId: u.id, nid: notificationId },
        t,
      );
      if (!inserted.length) continue; // already notified for this event
      await this.uow.execute(
        `INSERT INTO notifications (id, user_id, event_id, template_key, title, body, data, created_at)
         VALUES (:id, :userId, :eventId, :key, :title, :body, CAST(:data AS JSONB), now())`,
        { id: notificationId, userId: u.id, eventId, key: intent.template, title, body, data: JSON.stringify({ ...intent.data, url }) },
        t,
      );
      const prefs = u.channels || {};
      for (const channel of this.channels) {
        if (!intent.channels.includes(channel.name) || prefs[channel.name] === false || !channel.enabled()) continue;
        const delivery: Delivery = { userId: u.id, email: u.email, phone: u.phone, notificationId, templateKey: intent.template, title, body, url, data: intent.data };
        if (channel.name === 'in_app') {
          sends.push({ channel, delivery, deliveryId: inserted[0].id });
          continue;
        }
        const rows = await this.uow.execute(
          `INSERT INTO notification_deliveries (event_id, user_id, channel, notification_id, status, created_at, updated_at)
           VALUES (:eventId, :userId, :channel, :nid, 'pending', now(), now()) ON CONFLICT DO NOTHING RETURNING id`,
          { eventId, userId: u.id, channel: channel.name, nid: notificationId },
          t,
        );
        if (rows.length) sends.push({ channel, delivery, deliveryId: rows[0].id });
      }
    }
    t.afterCommit(() => {
      void this.send(sends);
    });
  }

  private async send(sends: Array<{ channel: NotificationChannel; delivery: Delivery; deliveryId: number }>) {
    for (const s of sends) {
      let status = 'sent';
      let error: string | null = null;
      try {
        if (!(await s.channel.send(s.delivery))) status = 'skipped';
      } catch (err) {
        status = 'failed';
        error = String(err).slice(0, 500);
        this.logger.warn(`${s.channel.name} delivery ${s.deliveryId} failed: ${error}`);
      }
      if (s.channel.name !== 'in_app') {
        await this.uow
          .execute(`UPDATE notification_deliveries SET status = :status, attempts = attempts + 1, last_error = :error, updated_at = now() WHERE id = :id`, { status, error, id: s.deliveryId }, null, true)
          .catch((err) => this.logger.warn(`could not record delivery: ${err}`));
      }
    }
  }

  private async employerUsers(companyId: number, t: Transaction): Promise<number[]> {
    const rows = await this.uow.select<{ id: number }>(
      `SELECT id FROM users WHERE company_id = :companyId AND role IN ('admin', 'manager') AND is_active = true AND deleted_at IS NULL`,
      { companyId },
      t,
    );
    return rows.map((r) => r.id);
  }

  private async workerName(workerId: number, t: Transaction): Promise<string> {
    const [row] = await this.uow.select<{ full_name: string }>(`SELECT full_name FROM worker_profiles WHERE user_id = :id`, { id: workerId }, t);
    return row?.full_name ?? `#${workerId}`;
  }
}

/** Deterministic UUID-shaped id for synthetic events (timer reminders) so retries dedupe. */
function uuidFrom(key: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const h = require('crypto').createHash('sha1').update(key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
