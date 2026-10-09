import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';
import { bigintNumber } from './sn-column.helpers';

@Table({ tableName: 'projection_checkpoints', timestamps: false })
export default class ProjectionCheckpoint extends Model {
  @PrimaryKey
  @Column({ type: DataType.TEXT })
  projection_name!: string;

  @Column(bigintNumber('last_global_position', { allowNull: false, defaultValue: 0 }))
  last_global_position!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
