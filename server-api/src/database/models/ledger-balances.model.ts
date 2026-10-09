import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';
import { bigintNumber } from './sn-column.helpers';

@Table({ tableName: 'ledger_balances', timestamps: false })
export default class LedgerBalance extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID })
  account_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  account_type!: string;

  @Column(bigintNumber('balance_vnd', { allowNull: false, defaultValue: 0 }))
  balance_vnd!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  version!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
