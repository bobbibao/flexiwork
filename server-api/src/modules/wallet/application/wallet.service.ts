import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import PaymentIntent from 'src/database/models/payment-intents.model';
import WorkerProfile from 'src/database/models/worker-profiles.model';
import User from 'src/database/models/users.model';
import { RoleEnum } from 'src/shared/enums';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { Money } from 'src/shared/domain/money';
import { Actor, systemActor, userActor } from 'src/shared/events/actor';
import { WALLET_EVENTS } from 'src/shared/contracts/events/wallet.events';
import { AutonomyPolicyService } from 'src/shared/autonomy/autonomy-policy.service';
import { ExceptionCaseService } from 'src/shared/autonomy/exception-case.service';
import { DECISION_POINTS } from 'src/shared/autonomy/decision-points.constant';
import { CodedError, forbidden, notFound } from 'src/shared/utils/coded.error';
import { snConfig } from 'src/shared/sn-runtime';
import { Accounts } from '../domain/account-code';
import { JournalTemplates } from '../domain/journal-templates';
import { InsufficientFundsError } from '../domain/errors/ledger.errors';
import { SequelizeLedgerRepository } from '../infrastructure/sequelize-ledger.repository';
import { BankAccountRef, PAYMENT_GATEWAY, PaymentGateway } from './ports/payment-gateway.port';
import { emitWalletEvent } from './wallet-events';

const MIN_TOPUP_VND = 10_000;
const MAX_TOPUP_VND = 500_000_000;
const MIN_PAYOUT_VND = 50_000;

const JOURNAL_LABELS: Record<string, string> = {
  TOPUP: 'topup',
  ESCROW_HOLD: 'escrow_hold',
  ESCROW_RELEASE: 'escrow_release',
  ESCROW_REFUND: 'escrow_refund',
  CANCEL_COMPENSATION: 'cancel_compensation',
  PAYOUT_REQUEST: 'payout_request',
  PAYOUT_SETTLED: 'payout_settled',
  PAYOUT_FAILED: 'payout_failed',
};

/** Wallet application service: top-ups, payouts, webhooks, queries (PLAN.md P3). */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly ledger: SequelizeLedgerRepository,
    private readonly outbox: OutboxService,
    private readonly autonomy: AutonomyPolicyService,
    private readonly exceptions: ExceptionCaseService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  accountFor(user: User) {
    if (user.role === RoleEnum.WORKER) return Accounts.worker(user.id);
    if (user.company_id && (user.role === RoleEnum.ADMIN || user.role === RoleEnum.MANAGER)) return Accounts.employer(user.company_id);
    throw forbidden('WALLET_NOT_AVAILABLE', 'No wallet for this account');
  }

  async wallet(user: User) {
    const account = this.accountFor(user);
    const balance = await this.ledger.balance(account.code);
    const result: Record<string, unknown> = { account_code: account.code, balance_vnd: balance.amount, currency: 'VND' };
    if (account.type === 'employer_wallet') {
      const [row] = await this.uow.select<{ held: string }>(
        `SELECT COALESCE(SUM(b.balance_vnd), 0) AS held
         FROM ledger_balances b JOIN ledger_accounts a ON a.id = b.account_id
         JOIN shift_views s ON a.owner_type = 'shift' AND s.id::text = a.owner_id
         WHERE s.company_id = :companyId`,
        { companyId: user.company_id },
      );
      result.escrow_held_vnd = Number(row?.held ?? 0);
    } else {
      result.payout_pending_vnd = (await this.ledger.balance(Accounts.payoutPending(user.id).code)).amount;
    }
    return result;
  }

  async statement(user: User, page = 1, pageSize = 20) {
    const account = this.accountFor(user);
    const accountId = await this.ledger.accountId(account.code);
    if (!accountId) return { items: [], total_items: 0, page, page_size: pageSize, total_pages: 0 };
    const limit = Math.min(Math.max(pageSize, 1), 100);
    const offset = (Math.max(page, 1) - 1) * limit;
    const items = await this.uow.select<any>(
      `SELECT e.id, e.amount_vnd, e.balance_after_vnd, e.created_at, j.journal_type, j.reference_type, j.reference_id, j.metadata
       FROM ledger_entries e JOIN ledger_journals j ON j.id = e.journal_id
       WHERE e.account_id = :accountId ORDER BY e.id DESC LIMIT :limit OFFSET :offset`,
      { accountId, limit, offset },
    );
    const [{ count }] = await this.uow.select<{ count: string }>(`SELECT COUNT(*) AS count FROM ledger_entries WHERE account_id = :accountId`, { accountId });
    return {
      items: items.map((r) => ({
        id: Number(r.id),
        type: JOURNAL_LABELS[r.journal_type] ?? r.journal_type,
        amount_vnd: Number(r.amount_vnd),
        balance_after_vnd: Number(r.balance_after_vnd),
        reference_type: r.reference_type,
        reference_id: r.reference_id,
        metadata: r.metadata,
        created_at: r.created_at,
      })),
      total_items: Number(count),
      page,
      page_size: limit,
      total_pages: Math.ceil(Number(count) / limit),
    };
  }

  async createTopUp(user: User, amountVnd: number, idempotencyKey: string) {
    if (!user.company_id || user.role === RoleEnum.WORKER) throw forbidden('TOPUP_EMPLOYER_ONLY', 'Only employers can top up');
    if (!Number.isSafeInteger(amountVnd) || amountVnd < MIN_TOPUP_VND || amountVnd > MAX_TOPUP_VND) {
      throw new CodedError('TOPUP_AMOUNT_INVALID', `Amount must be between ${MIN_TOPUP_VND} and ${MAX_TOPUP_VND} VND`);
    }
    const account = Accounts.employer(user.company_id);
    const intent = await this.uow.run(async (t) => {
      const existing = await PaymentIntent.findOne({ where: { idempotency_key: `topup:${user.id}:${idempotencyKey}` }, transaction: t });
      if (existing) return existing;
      const accountId = await this.ledger.ensureAccount(account, t);
      return PaymentIntent.create(
        {
          id: randomUUID(),
          kind: 'topup',
          account_id: accountId,
          owner_type: 'company',
          owner_id: String(user.company_id),
          amount_vnd: amountVnd,
          provider: this.gateway.provider,
          status: 'created',
          idempotency_key: `topup:${user.id}:${idempotencyKey}`,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );
    });
    if (intent.status !== 'created') return this.intentView(intent);
    const created = await this.gateway.createTopUp({ intentId: intent.id, amountVnd, returnUrl: `${snConfig().FRONTEND_URL ?? ''}/#/sn/wallet` });
    intent.set({ provider_ref: created.providerRef, status: 'pending', details: created, updated_at: new Date() } as any);
    await intent.save();
    return this.intentView(intent);
  }

  async requestPayout(user: User, amountVnd: number, idempotencyKey: string, bankAccount?: BankAccountRef) {
    if (user.role !== RoleEnum.WORKER) throw forbidden('PAYOUT_WORKER_ONLY', 'Only workers can request payouts');
    if (!Number.isSafeInteger(amountVnd) || amountVnd < MIN_PAYOUT_VND) {
      throw new CodedError('PAYOUT_AMOUNT_INVALID', `Minimum payout is ${MIN_PAYOUT_VND} VND`);
    }
    if (!(await this.autonomy.isEnabled(DECISION_POINTS.PAYOUTS_ENABLED))) {
      throw new CodedError('PAYOUTS_PAUSED', 'Payouts are temporarily paused', 503);
    }
    const profile = await WorkerProfile.findOne({ where: { user_id: user.id } });
    const bank = (bankAccount ?? (profile?.bank_account as BankAccountRef | null)) || null;
    if (!bank) throw new CodedError('BANK_ACCOUNT_REQUIRED', 'Add a bank account first');

    const key = `payout:${user.id}:${idempotencyKey}`;
    const existingIntent = await PaymentIntent.findOne({ where: { idempotency_key: key } });
    if (existingIntent) return this.intentView(existingIntent);

    const previousPayouts = await PaymentIntent.count({ where: { kind: 'payout', owner_id: String(user.id), status: 'succeeded' } });
    const policy = await this.autonomy.policy(DECISION_POINTS.PAYOUT_APPROVAL);
    const maxAuto = Number(policy.limits.max_amount_vnd ?? snConfig().SN_AUTO_PAYOUT_MAX_VND);
    const intentId = randomUUID();
    const decision = await this.autonomy.decide({
      point: DECISION_POINTS.PAYOUT_APPROVAL,
      subjectType: 'payment_intent',
      subjectId: intentId,
      inputs: { amount_vnd: amountVnd, max_auto_vnd: maxAuto, previous_payouts: previousPayouts },
      rule: (i) =>
        Number(i.amount_vnd) <= Number(i.max_auto_vnd) && Number(i.previous_payouts) > 0
          ? { outcome: 'approve', confidence: 1, rationale: 'Within the automatic payout limit and not a first payout' }
          : { outcome: 'review', confidence: 0.5, rationale: Number(i.previous_payouts) === 0 ? 'First payout needs a human check' : 'Above the automatic payout limit' },
    });

    const actor = userActor(user);
    const intent = await this.uow.run(async (t) => {
      const accountId = await this.ledger.ensureAccount(Accounts.worker(user.id), t);
      const created = await PaymentIntent.create(
        {
          id: intentId,
          kind: 'payout',
          account_id: accountId,
          owner_type: 'worker',
          owner_id: String(user.id),
          amount_vnd: amountVnd,
          provider: this.gateway.provider,
          status: decision.execute ? 'pending' : 'awaiting_approval',
          idempotency_key: key,
          details: { bank_account: bank, decision_id: decision.id },
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );
      try {
        await this.ledger.post(JournalTemplates.payoutRequest(intentId, user.id, Money.vnd(amountVnd)), t);
      } catch (err) {
        if (err instanceof InsufficientFundsError) throw new CodedError('INSUFFICIENT_FUNDS', 'Not enough balance', 422, { available_vnd: err.availableVnd });
        throw err;
      }
      await emitWalletEvent(this.outbox, t, WALLET_EVENTS.PAYOUT_REQUESTED, `worker:${user.id}`, null, {
        intent_id: intentId,
        worker_id: user.id,
        amount_vnd: amountVnd,
        provider_ref: null,
      }, { actor });
      if (!decision.execute) {
        await this.exceptions.open(
          {
            type: 'payout_approval',
            severity: 'medium',
            subjectType: 'payment_intent',
            subjectId: intentId,
            dedupeKey: `payout_approval:${intentId}`,
            summary: `Duyệt rút tiền ${amountVnd.toLocaleString('vi-VN')} ₫ cho người lao động #${user.id}`,
            details: { worker_id: user.id, amount_vnd: amountVnd, rationale: decision.rationale },
            suggestedActions: [
              { action: 'approve_payout', label_vi: 'Duyệt rút tiền', params: { intent_id: intentId } },
              { action: 'reject_payout', label_vi: 'Từ chối và hoàn tiền vào ví', params: { intent_id: intentId } },
            ],
            openedBy: systemActor('wallet'),
          },
          t,
        );
      }
      return created;
    });
    if (decision.execute) await this.sendPayout(intent);
    return this.intentView(intent);
  }

  /** Ops approval for a payout waiting in the exception queue. */
  async approvePayout(intentId: string, actor: Actor) {
    const intent = await PaymentIntent.findByPk(intentId);
    if (!intent || intent.kind !== 'payout') throw notFound('PAYMENT_INTENT_NOT_FOUND', 'Payout not found');
    if (intent.status !== 'awaiting_approval') return this.intentView(intent);
    if (!(await this.autonomy.isEnabled(DECISION_POINTS.PAYOUTS_ENABLED))) throw new CodedError('PAYOUTS_PAUSED', 'Payouts are paused', 503);
    intent.set({ status: 'pending', updated_at: new Date(), details: { ...(intent.details ?? {}), approved_by: actor } } as any);
    await intent.save();
    await this.sendPayout(intent);
    return this.intentView(intent);
  }

  async rejectPayout(intentId: string, actor: Actor, reason = 'rejected_by_ops') {
    const intent = await PaymentIntent.findByPk(intentId);
    if (!intent || intent.kind !== 'payout') throw notFound('PAYMENT_INTENT_NOT_FOUND', 'Payout not found');
    if (intent.status !== 'awaiting_approval') return this.intentView(intent);
    await this.finishPayout(intent, 'failed', reason, actor);
    return this.intentView(await PaymentIntent.findByPk(intentId));
  }

  async handleWebhook(provider: string, headers: Record<string, any>, rawBody: Buffer) {
    if (provider !== this.gateway.provider) throw notFound('PROVIDER_UNKNOWN', 'Unknown payment provider');
    let event;
    try {
      event = await this.gateway.parseWebhook(headers, rawBody);
    } catch (err) {
      throw new CodedError('WEBHOOK_SIGNATURE_INVALID', String(err), 401);
    }
    const intent = await PaymentIntent.findOne({ where: { provider, provider_ref: event.providerRef } });
    if (!intent) throw notFound('PAYMENT_INTENT_NOT_FOUND', 'Unknown provider reference');
    if (intent.status === 'succeeded' || intent.status === 'failed') return { duplicate: true, status: intent.status };
    const actor = systemActor(`gateway:${provider}`);
    if (intent.kind === 'topup') await this.finishTopUp(intent, event.status, event.error, event.raw, actor);
    else await this.finishPayout(intent, event.status, event.error, actor, event.raw);
    return { duplicate: false, status: event.status };
  }

  private async sendPayout(intent: PaymentIntent) {
    try {
      const { providerRef } = await this.gateway.createPayout({
        intentId: intent.id,
        amountVnd: intent.amount_vnd,
        bankAccount: (intent.details?.bank_account as BankAccountRef) ?? null,
      });
      intent.set({ provider_ref: providerRef, updated_at: new Date() } as any);
      await intent.save();
    } catch (err) {
      this.logger.error(`payout ${intent.id} could not be sent: ${err}`);
      await this.finishPayout(intent, 'failed', String(err), systemActor('wallet'));
    }
  }

  private async finishTopUp(intent: PaymentIntent, status: 'succeeded' | 'failed', error: string | undefined, raw: Record<string, unknown>, actor: Actor) {
    const companyId = Number(intent.owner_id);
    await this.uow.run(async (t) => {
      const locked = await PaymentIntent.findByPk(intent.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!locked || locked.status === 'succeeded' || locked.status === 'failed') return;
      if (status === 'succeeded') {
        await this.ledger.post(JournalTemplates.topUp(intent.id, companyId, Money.vnd(intent.amount_vnd), intent.provider), t);
      }
      locked.set({ status, raw_last_webhook: raw, updated_at: new Date() } as any);
      await locked.save({ transaction: t });
      await emitWalletEvent(
        this.outbox,
        t,
        status === 'succeeded' ? WALLET_EVENTS.TOPUP_SUCCEEDED : WALLET_EVENTS.TOPUP_FAILED,
        `company:${companyId}`,
        companyId,
        { intent_id: intent.id, company_id: companyId, amount_vnd: intent.amount_vnd, provider_ref: intent.provider_ref, ...(error && { error }) },
        { actor },
      );
    });
  }

  private async finishPayout(intent: PaymentIntent, status: 'succeeded' | 'failed', error: string | undefined, actor: Actor, raw?: Record<string, unknown>) {
    const workerId = Number(intent.owner_id);
    await this.uow.run(async (t) => {
      const locked = await PaymentIntent.findByPk(intent.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!locked || locked.status === 'succeeded' || locked.status === 'failed') return;
      const amount = Money.vnd(intent.amount_vnd);
      await this.ledger.post(
        status === 'succeeded' ? JournalTemplates.payoutSettled(intent.id, workerId, amount, intent.provider) : JournalTemplates.payoutFailed(intent.id, workerId, amount),
        t,
      );
      locked.set({ status, ...(raw && { raw_last_webhook: raw }), updated_at: new Date(), details: { ...(locked.details ?? {}), ...(error && { error }) } } as any);
      await locked.save({ transaction: t });
      await emitWalletEvent(
        this.outbox,
        t,
        status === 'succeeded' ? WALLET_EVENTS.PAYOUT_SETTLED : WALLET_EVENTS.PAYOUT_FAILED,
        `worker:${workerId}`,
        null,
        { intent_id: intent.id, worker_id: workerId, amount_vnd: intent.amount_vnd, provider_ref: intent.provider_ref, ...(error && { error }) },
        { actor },
      );
      if (status === 'failed' && error !== 'rejected_by_ops') {
        await this.exceptions.open(
          {
            type: 'payout_failed',
            severity: 'high',
            subjectType: 'payment_intent',
            subjectId: intent.id,
            dedupeKey: `payout_failed:${intent.id}`,
            summary: `Rút tiền thất bại (${error ?? 'unknown'}) cho người lao động #${workerId}; tiền đã hoàn vào ví`,
            details: { worker_id: workerId, amount_vnd: intent.amount_vnd, error },
            suggestedActions: [{ action: 'contact_worker', label_vi: 'Liên hệ người lao động kiểm tra tài khoản ngân hàng' }],
            openedBy: actor,
          },
          t,
        );
      }
    });
  }

  intentView(intent: PaymentIntent | null) {
    if (!intent) return null;
    return {
      id: intent.id,
      kind: intent.kind,
      amount_vnd: intent.amount_vnd,
      provider: intent.provider,
      provider_ref: intent.provider_ref,
      status: intent.status,
      qr_payload: intent.details?.qrPayload ?? null,
      created_at: intent.created_at,
      updated_at: intent.updated_at,
    };
  }

  async intent(user: User, id: string) {
    const intent = await PaymentIntent.findByPk(id);
    const owner = user.role === RoleEnum.WORKER ? String(user.id) : String(user.company_id);
    if (!intent || intent.owner_id !== owner) throw notFound('PAYMENT_INTENT_NOT_FOUND', 'Not found');
    return this.intentView(intent);
  }
}
