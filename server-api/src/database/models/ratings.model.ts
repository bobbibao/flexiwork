import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({
  tableName: 'ratings',
  timestamps: false,
  indexes: [{ unique: true, fields: ['shift_id', 'rater_id'] }, { fields: ['ratee_role', 'ratee_id'] }],
})
export default class Rating extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @Column({ type: DataType.UUID, allowNull: false })
  shift_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  rater_role!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  rater_id!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  ratee_role!: string;

  /** worker user id, or company id when the ratee is the employer */
  @Column({ type: DataType.INTEGER, allowNull: false })
  ratee_id!: number;

  @Column({ type: DataType.SMALLINT, allowNull: false })
  stars!: number;

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: false, defaultValue: [] })
  tags!: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  comment!: string | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;
}
