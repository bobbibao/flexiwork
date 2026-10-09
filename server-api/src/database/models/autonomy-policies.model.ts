import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'autonomy_policies', timestamps: false })
export default class AutonomyPolicy extends Model {
  @PrimaryKey
  @Column({ type: DataType.TEXT })
  decision_point!: string;

  /** manual | suggest | auto */
  @Column({ type: DataType.TEXT, allowNull: false })
  mode!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  enabled!: boolean;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  limits!: Record<string, any>;

  @Column({ type: DataType.TEXT, allowNull: true })
  description_vi!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  updated_by!: number | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
