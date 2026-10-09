import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'push_subscriptions', timestamps: false, indexes: [{ fields: ['user_id'] }] })
export default class PushSubscription extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id!: number;

  /** webpush | fcm */
  @Column({ type: DataType.TEXT, allowNull: false })
  platform!: string;

  /** Web Push endpoint URL or FCM token */
  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  endpoint!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  keys!: Record<string, string> | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  user_agent!: string | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  last_seen_at!: Date;
}
