import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({ tableName: 'ledger_accounts', timestamps: false })
export default class LedgerAccount extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  code!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  account_type!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  owner_type!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  owner_id!: string | null;

  @Column({ type: DataType.CHAR(3), allowNull: false, defaultValue: 'VND' })
  currency!: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;
}
