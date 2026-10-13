/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

/**
 * Inline projection guarding against double booking (docs/ARCHITECTURE.md §9.6).
 * The EXCLUDE USING gist constraint is created by migration v0.1.0 (sn-shift).
 */
@Table({ tableName: 'worker_shift_reservations', timestamps: false })
export default class WorkerShiftReservation extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  shift_id!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  worker_id!: number;

  @Column({ type: DataType.RANGE(DataType.DATE), allowNull: false })
  during!: any;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: boolean;
}
