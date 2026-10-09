import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'notification_deliveries', timestamps: false, indexes: [{ unique: true, fields: ['event_id', 'user_id', 'channel'] }] })
export default class NotificationDelivery extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @Column({ type: DataType.UUID, allowNull: false })
  event_id!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  channel!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  notification_id!: string | null;

  /** pending | sent | failed | skipped */
  @Column({ type: DataType.TEXT, allowNull: false })
  status!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  attempts!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  last_error!: string | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
