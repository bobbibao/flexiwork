/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'ledger_journals', timestamps: false, indexes: [{ fields: ['reference_type', 'reference_id'] }] })
export default class LedgerJournal extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  journal_type!: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  idempotency_key!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  reference_type!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  reference_id!: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  metadata!: Record<string, any>;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;
}
