import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { numericNumber } from './sn-column.helpers';

@Table({ tableName: 'employer_profiles', timestamps: false })
export default class EmployerProfile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  company_id!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  legal_name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  tax_code!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  business_type!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  phone_e164!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  address!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  province_code!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  ward_code!: string | null;

  @Column(numericNumber('lat', { allowNull: true }))
  lat!: number | null;

  @Column(numericNumber('lng', { allowNull: true }))
  lng!: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  verified!: boolean;

  @Column(numericNumber('rating_avg', { allowNull: true }))
  rating_avg!: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  rating_count!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
