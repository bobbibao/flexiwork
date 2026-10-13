/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';
import { bigintNumber } from './sn-column.helpers';

@Table({ tableName: 'payment_intents', timestamps: false, indexes: [{ fields: ['provider', 'provider_ref'] }, { fields: ['account_id'] }] })
export default class PaymentIntent extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  /** topup | payout */
  @Column({ type: DataType.TEXT, allowNull: false })
  kind!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  account_id!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  owner_type!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  owner_id!: string | null;

  @Column(bigintNumber('amount_vnd', { allowNull: false }))
  amount_vnd!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  provider!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  provider_ref!: string | null;

  /** created | pending | awaiting_approval | succeeded | failed */
  @Column({ type: DataType.TEXT, allowNull: false })
  status!: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  idempotency_key!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  details!: Record<string, any> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  raw_last_webhook!: Record<string, any> | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
