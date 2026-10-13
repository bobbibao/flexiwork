/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { bigintNumber } from './sn-column.helpers';

/** Append-only event store (docs/ARCHITECTURE.md §7.3). */
@Table({
  tableName: 'event_store',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['stream_id', 'stream_version'] },
    { fields: ['stream_type', 'global_position'] },
  ],
})
export default class EventStoreEntry extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(bigintNumber('global_position'))
  global_position!: number;

  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  event_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  stream_type!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  stream_id!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  stream_version!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  event_type!: string;

  @Column({ type: DataType.SMALLINT, allowNull: false, defaultValue: 1 })
  event_version!: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  payload!: Record<string, any>;

  @Column({ type: DataType.JSONB, allowNull: false })
  metadata!: Record<string, any>;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  occurred_at!: Date;
}
