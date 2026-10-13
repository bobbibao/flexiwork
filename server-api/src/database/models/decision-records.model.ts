/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'decision_records', timestamps: false, indexes: [{ fields: ['subject_type', 'subject_id'] }, { fields: ['decision_point', 'created_at'] }] })
export default class DecisionRecord extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  decision_point!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  subject_type!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  subject_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  mode!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  outcome!: string;

  @Column({ type: DataType.DECIMAL, allowNull: false })
  confidence!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  rationale!: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  inputs!: Record<string, any>;

  @Column({ type: DataType.TEXT, allowNull: false })
  provider!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  executed!: boolean;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;
}
