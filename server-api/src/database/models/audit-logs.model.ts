import {
  Model,
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import User from './users.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuditLogData = Record<string, any>;

@Table({
  tableName: 'audit_logs',
  timestamps: false, // Disable automatic timestamps
  paranoid: false, // Disable soft deletes
  indexes: [{ fields: ['user_id'] }, { fields: ['object_id'] }, { fields: ['action'] }, { fields: ['module'] }],
})
export default class AuditLog extends Model<AuditLog> {
  @ApiProperty({ description: 'Unique identifier for the audit log', type: Number })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id!: number;

  @ApiProperty({ description: 'ID of the user who performed the action', type: Number })
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @ApiProperty({ description: 'ID of the object that was modified', type: Number })
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  object_id!: number | null;

  @ApiProperty({ description: 'Action performed (CREATE, UPDATE, DELETE, etc.)', type: String })
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  action!: string;

  @ApiProperty({ description: 'Module or feature where the action occurred', type: String })
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  module!: string;

  @ApiProperty({ description: 'API endpoint that was called', type: String })
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  api_endpoint!: string;

  @ApiProperty({ description: 'Data before the change', type: Object })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  before!: AuditLogData | null;

  @ApiProperty({ description: 'Data after the change', type: Object })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  after!: AuditLogData | null;

  @ApiProperty({ description: 'Timestamp when the audit log was created', type: Date })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  @CreatedAt
  created_at!: Date;

  @BelongsTo(() => User)
  user?: User;
}
