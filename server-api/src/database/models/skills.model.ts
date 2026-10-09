import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'skills', timestamps: false })
export default class Skill extends Model {
  @PrimaryKey
  @Column({ type: DataType.TEXT })
  code!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  name_vi!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  sort_order!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: boolean;
}
