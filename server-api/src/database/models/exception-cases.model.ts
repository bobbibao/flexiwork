import { Table, Column, Model, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({
  tableName: 'exception_cases',
  timestamps: false,
  indexes: [{ fields: ['status', 'severity', 'created_at'] }, { fields: ['subject_type', 'subject_id'] }],
})
export default class ExceptionCase extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  type!: string;

  /** low | medium | high | critical */
  @Column({ type: DataType.TEXT, allowNull: false })
  severity!: string;

  /** OPEN | ACKNOWLEDGED | RESOLVED | DISMISSED */
  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: 'OPEN' })
  status!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  subject_type!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  subject_id!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  company_id!: number | null;

  /** Dedupe key so the same fact does not open two cases */
  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  dedupe_key!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  summary!: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  details!: Record<string, any>;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  suggested_actions!: Array<Record<string, any>>;

  @Column({ type: DataType.JSONB, allowNull: false })
  opened_by!: Record<string, any>;

  @Column({ type: DataType.INTEGER, allowNull: true })
  assignee_id!: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  sla_due_at!: Date | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  resolution!: Record<string, any> | null;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at!: Date;
}
