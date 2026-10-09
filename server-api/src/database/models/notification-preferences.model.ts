import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'notification_preferences', timestamps: false })
export default class NotificationPreference extends Model {
  @PrimaryKey
  @Column({ type: DataType.INTEGER })
  user_id!: number;

  /** e.g. { "push": true, "email": false, "in_app": true } */
  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  channels!: Record<string, boolean>;

  /** per template key overrides: { "shift_offered": { "push": false } } */
  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  templates!: Record<string, Record<string, boolean>>;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
