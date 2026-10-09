import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Transaction } from 'sequelize';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { Money } from 'src/shared/domain/money';
import { AccountRef, mayGoNegative } from '../domain/account-code';
import { Journal } from '../domain/ledger-posting';
import { InsufficientFundsError } from '../domain/errors/ledger.errors';

export interface PostedJournal {
  journalId: string;
  created: boolean;
}

/**
 * Append-only double-entry ledger (docs/ARCHITECTURE.md §8).
 * Locks balances FOR UPDATE in ascending account id order (deadlock-free), checks non-negative balances,
 * writes journal + entries + balances in the caller's transaction. Idempotent by journal.idempotency_key.
 */
@Injectable()
export class SequelizeLedgerRepository {
  constructor(private readonly uow: UnitOfWork) {}

  async post(journal: Journal, t: Transaction): Promise<PostedJournal> {
    const [existing] = await this.uow.select<{ id: string }>(
      `SELECT id FROM ledger_journals WHERE idempotency_key = :key`,
      { key: journal.idempotencyKey },
      t,
    );
    if (existing) return { journalId: existing.id, created: false };

    const accountIds = new Map<string, string>();
    for (const p of journal.postings) accountIds.set(p.account.code, await this.ensureAccount(p.account, t));

    const ordered = [...new Set(accountIds.values())].sort();
    const balances = await this.uow.select<{ account_id: string; balance_vnd: string }>(
      `SELECT account_id, balance_vnd FROM ledger_balances WHERE account_id IN (:ids) ORDER BY account_id FOR UPDATE`,
      { ids: ordered },
      t,
    );
    const current = new Map(balances.map((b) => [b.account_id, Number(b.balance_vnd)]));

    const deltas = new Map<string, number>();
    for (const p of journal.postings) {
      const id = accountIds.get(p.account.code)!;
      deltas.set(id, (deltas.get(id) ?? 0) + p.amount.amount);
    }
    for (const p of journal.postings) {
      const id = accountIds.get(p.account.code)!;
      const next = (current.get(id) ?? 0) + (deltas.get(id) ?? 0);
      if (next < 0 && !mayGoNegative(p.account.type)) {
        throw new InsufficientFundsError(p.account.code, current.get(id) ?? 0, -(deltas.get(id) ?? 0));
      }
    }

    const journalId = randomUUID();
    await this.uow.execute(
      `INSERT INTO ledger_journals (id, journal_type, idempotency_key, reference_type, reference_id, metadata, created_at)
       VALUES (:id, :type, :key, :refType, :refId, CAST(:metadata AS JSONB), now())`,
      {
        id: journalId,
        type: journal.type,
        key: journal.idempotencyKey,
        refType: journal.referenceType,
        refId: journal.referenceId,
        metadata: JSON.stringify(journal.metadata),
      },
      t,
    );
    const running = new Map(current);
    for (const p of journal.postings) {
      const id = accountIds.get(p.account.code)!;
      const after = (running.get(id) ?? 0) + p.amount.amount;
      running.set(id, after);
      await this.uow.execute(
        `INSERT INTO ledger_entries (journal_id, account_id, amount_vnd, balance_after_vnd, created_at)
         VALUES (:journalId, :accountId, :amount, :after, now())`,
        { journalId, accountId: id, amount: p.amount.amount, after },
        t,
      );
    }
    for (const id of ordered) {
      await this.uow.execute(
        `UPDATE ledger_balances SET balance_vnd = :balance, version = version + 1, updated_at = now() WHERE account_id = :id`,
        { id, balance: running.get(id) },
        t,
      );
    }
    return { journalId, created: true };
  }

  async balance(code: string, t?: Transaction | null): Promise<Money> {
    const [row] = await this.uow.select<{ balance_vnd: string }>(
      `SELECT b.balance_vnd FROM ledger_balances b JOIN ledger_accounts a ON a.id = b.account_id WHERE a.code = :code`,
      { code },
      t,
    );
    return Money.vnd(row ? Number(row.balance_vnd) : 0);
  }

  async accountId(code: string): Promise<string | null> {
    const [row] = await this.uow.select<{ id: string }>(`SELECT id FROM ledger_accounts WHERE code = :code`, { code });
    return row?.id ?? null;
  }

  async journalByKey(key: string, t?: Transaction | null): Promise<{ id: string; metadata: any } | null> {
    const [row] = await this.uow.select<{ id: string; metadata: any }>(
      `SELECT id, metadata FROM ledger_journals WHERE idempotency_key = :key`,
      { key },
      t,
    );
    return row ?? null;
  }

  async ensureAccount(account: AccountRef, t: Transaction): Promise<string> {
    await this.uow.execute(
      `INSERT INTO ledger_accounts (id, code, account_type, owner_type, owner_id, currency, created_at)
       VALUES (:id, :code, :type, :ownerType, :ownerId, 'VND', now()) ON CONFLICT (code) DO NOTHING`,
      { id: randomUUID(), code: account.code, type: account.type, ownerType: account.ownerType, ownerId: account.ownerId },
      t,
    );
    const [row] = await this.uow.select<{ id: string }>(`SELECT id FROM ledger_accounts WHERE code = :code`, { code: account.code }, t);
    await this.uow.execute(
      `INSERT INTO ledger_balances (account_id, account_type, balance_vnd, version, updated_at)
       VALUES (:id, :type, 0, 0, now()) ON CONFLICT (account_id) DO NOTHING`,
      { id: row.id, type: account.type },
      t,
    );
    return row.id;
  }
}
