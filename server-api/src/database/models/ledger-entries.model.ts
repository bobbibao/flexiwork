import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { bigintNumber } from './sn-column.helpers';

@Table({ tableName: 'ledger_entries', timestamps: false, indexes: [{ fields: ['account_id', 'id'] }, { fields: ['journal_id'] }] })
export default class LedgerEntry extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(bigintNumber('id'))
  id!: number;

  @Column({ type: DataType.UUID, allowNull: false })
  journal_id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  account_id!: string;

  @Column(bigintNumber('amount_vnd', { allowNull: false }))
  amount_vnd!: number;

  @Column(bigintNumber('balance_after_vnd', { allowNull: false }))
  balance_after_vnd!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;
}
