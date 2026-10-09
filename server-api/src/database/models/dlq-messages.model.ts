import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'dlq_messages', timestamps: false, indexes: [{ fields: ['status', 'created_at'] }] })
export default class DlqMessage extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  event_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  original_topic!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  consumer_group!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  error!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  attempts!: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  envelope!: Record<string, any>;

  /** OPEN | REPLAYED | DISMISSED */
  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: 'OPEN' })
  status!: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  replayed_at!: Date | null;
}
