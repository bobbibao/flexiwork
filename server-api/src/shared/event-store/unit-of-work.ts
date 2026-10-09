import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

/** One database transaction across event store, outbox and inline projections (docs/ARCHITECTURE.md §7.2). */
@Injectable()
export class UnitOfWork {
  constructor(@Inject('SEQUELIZE') readonly sequelize: Sequelize) {}

  run<T>(fn: (t: Transaction) => Promise<T>, existing?: Transaction | null): Promise<T> {
    if (existing) return fn(existing);
    return this.sequelize.transaction((t) => fn(t));
  }

  async select<T = any>(sql: string, replacements: Record<string, unknown> = {}, t?: Transaction | null, quiet = false): Promise<T[]> {
    return this.sequelize.query(sql, {
      replacements,
      transaction: t ?? undefined,
      type: QueryTypes.SELECT,
      ...(quiet ? { logging: false } : {}),
    }) as Promise<T[]>;
  }

  async execute(sql: string, replacements: Record<string, unknown> = {}, t?: Transaction | null, quiet = false): Promise<any[]> {
    const [rows] = await this.sequelize.query(sql, {
      replacements,
      transaction: t ?? undefined,
      ...(quiet ? { logging: false } : {}),
    });
    return rows as any[];
  }
}
