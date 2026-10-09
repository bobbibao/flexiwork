import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { bigintNumber } from './sn-column.helpers';

/** Transactional outbox (docs/ARCHITECTURE.md §6.5). */
@Table({ tableName: 'outbox_messages', timestamps: false })
export default class OutboxMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(bigintNumber('id'))
  id!: number;

  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  event_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  topic!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  partition_key!: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  headers!: Record<string, string>;

  @Column({ type: DataType.JSONB, allowNull: false })
  payload!: Record<string, any>;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  published_at!: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  attempts!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  last_error!: string | null;
}
