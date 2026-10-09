import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';
import { numericNumber } from './sn-column.helpers';

@Table({ tableName: 'work_locations', timestamps: false, indexes: [{ fields: ['company_id'] }] })
export default class WorkLocation extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  company_id!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  address!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  province_code!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  ward_code!: string | null;

  @Column(numericNumber('lat', { allowNull: false }))
  lat!: number;

  @Column(numericNumber('lng', { allowNull: false }))
  lng!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 150 })
  geofence_radius_m!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  qr_required!: boolean;

  @Column({ type: DataType.TEXT, allowNull: false })
  qr_secret!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: boolean;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
