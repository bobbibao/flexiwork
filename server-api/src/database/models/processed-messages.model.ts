import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

/** Idempotent-consumer inbox: one row per (consumer group, event). */
@Table({ tableName: 'processed_messages', timestamps: false })
export default class ProcessedMessage extends Model {
  @PrimaryKey
  @Column({ type: DataType.TEXT })
  consumer_group!: string;

  @PrimaryKey
  @Column({ type: DataType.UUID })
  event_id!: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  processed_at!: Date;
}
