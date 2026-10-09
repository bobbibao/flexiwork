import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'aggregate_snapshots', timestamps: false })
export default class AggregateSnapshot extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  stream_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  stream_type!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  stream_version!: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  state!: Record<string, any>;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;
}
