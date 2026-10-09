import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';
import { bigintNumber, numericNumber } from './sn-column.helpers';

/** Read model of the Shift aggregate (docs/ARCHITECTURE.md §7.4). Written only by ShiftViewProjector. */
@Table({
  tableName: 'shift_views',
  timestamps: false,
  indexes: [{ fields: ['company_id', 'status', 'start_at'] }, { fields: ['worker_id', 'start_at'] }, { fields: ['job_ref'] }],
})
export default class ShiftView extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  job_ref!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  company_id!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  company_name!: string | null;

  @Column({ type: DataType.UUID, allowNull: false })
  work_location_id!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  location_name!: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  skill_code!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  start_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  end_at!: Date;

  @Column(bigintNumber('hourly_vnd', { allowNull: false }))
  hourly_vnd!: number;

  @Column(bigintNumber('estimated_gross_vnd', { allowNull: false }))
  estimated_gross_vnd!: number;

  @Column(bigintNumber('platform_fee_vnd', { allowNull: false }))
  platform_fee_vnd!: number;

  @Column(bigintNumber('escrow_amount_vnd', { allowNull: false }))
  escrow_amount_vnd!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  dispatch_mode!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  status!: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: 'none' })
  escrow_status!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  worker_id!: number | null;

  @Column({ type: DataType.ARRAY(DataType.INTEGER), allowNull: false, defaultValue: [] })
  offered_worker_ids!: number[];

  @Column({ type: DataType.DATE, allowNull: true })
  offer_expires_at!: Date | null;

  @Column(numericNumber('lat', { allowNull: false }))
  lat!: number;

  @Column(numericNumber('lng', { allowNull: false }))
  lng!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  address!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  province_code!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  ward_code!: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  checked_in_at!: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  checked_out_at!: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  worked_minutes!: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  approved_minutes!: number | null;

  @Column(bigintNumber('gross_vnd', { allowNull: true }))
  gross_vnd!: number | null;

  @Column(bigintNumber('fee_vnd', { allowNull: true }))
  fee_vnd!: number | null;

  @Column(bigintNumber('pit_vnd', { allowNull: true }))
  pit_vnd!: number | null;

  @Column(bigintNumber('net_vnd', { allowNull: true }))
  net_vnd!: number | null;

  @Column(bigintNumber('refund_vnd', { allowNull: true }))
  refund_vnd!: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  cancel_reason!: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  employer_rated!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  worker_rated!: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  version!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  posted_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updated_at!: Date;
}
