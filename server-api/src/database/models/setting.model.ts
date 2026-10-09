import { Table, Column, Model, DataType, Unique, PrimaryKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'settings',
})
export default class Setting extends Model<Setting> {
  @ApiProperty({
    description: 'The ID of the company associated with the settings',
    type: Number,
  })
  @PrimaryKey
  @Unique
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  company_id!: number;

  @ApiProperty({
    description: 'Master data settings',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  master_data!: object | null;

  @ApiProperty({
    description: 'Offer settings',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offer!: Record<string, any> | null;

  @ApiProperty({
    description: 'Project settings',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project!: Record<string, any> | null;

  @ApiProperty({
    description: 'Invoice settings',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoice!: Record<string, any> | null;

  @ApiProperty({
    description: 'Timesheet settings',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timesheet!: Record<string, any> | null;

  @ApiProperty({
    description: 'PDF layout settings',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  pdf_layout!: object | null;

  @ApiProperty({
    description: 'Product settings',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  product!: object | null;

  @ApiProperty({
    description: 'The ID of the user who created the settings entry',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  task!: TaskSetting | null;

  @ApiProperty({
    description: 'The timestamp when the settings entry was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the settings entry was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';
}

export type TabOfSettings =
  | 'masterdata'
  | 'offer'
  | 'project'
  | 'invoice'
  | 'timesheet'
  | 'pdflayout'
  | 'product'
  | 'task';

export interface TaskState {
  id: number;
  label: string;
  color: string;
}

export interface TaskSetting {
  statuses: TaskState[];
  priorities: TaskState[];
}
