import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'notifications', timestamps: false, indexes: [{ fields: ['user_id', 'created_at'] }] })
export default class Notification extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id!: number;

  @Column({ type: DataType.UUID, allowNull: false })
  event_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  template_key!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  body!: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  data!: Record<string, any>;

  @Column({ type: DataType.DATE, allowNull: true })
  read_at!: Date | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;
}
