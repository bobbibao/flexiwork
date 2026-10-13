/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { numericNumber } from './sn-column.helpers';

@Table({ tableName: 'worker_profiles', timestamps: false })
export default class WorkerProfile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  user_id!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  full_name!: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  phone_e164!: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  dob!: string | null;

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: false, defaultValue: [] })
  skill_codes!: string[];

  @Column(numericNumber('home_lat', { allowNull: true }))
  home_lat!: number | null;

  @Column(numericNumber('home_lng', { allowNull: true }))
  home_lng!: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  home_address!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 10 })
  radius_km!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  verified!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  suspended!: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 80 })
  reliability_score!: number;

  @Column(numericNumber('rating_avg', { allowNull: true }))
  rating_avg!: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  rating_count!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  completed_shifts!: number;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  consents!: Record<string, any>;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  availability!: Record<string, any>;

  @Column({ type: DataType.JSONB, allowNull: true })
  bank_account!: Record<string, any> | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
