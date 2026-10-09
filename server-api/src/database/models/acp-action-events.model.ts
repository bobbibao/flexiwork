import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Default } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'acp_action_events',
})
export default class AcpActionEvent extends Model<AcpActionEvent> {
  @ApiProperty({
    description: 'The unique identifier of the action event',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id!: number;

  @ApiProperty({
    description: 'The batch ID of the action event',
    type: String,
  })
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  batch_id!: string;

  @ApiProperty({
    description: 'The user ID associated with the action event',
    type: Number,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  user_id!: number;

  @ApiProperty({
    description: 'The name of the action event',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  name!: string;

  @ApiProperty({
    description: 'The actionable type of the event',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  actionable_type!: string;

  @ApiProperty({
    description: 'The actionable ID of the event',
    type: Number,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  actionable_id!: number;

  @ApiProperty({
    description: 'The target type of the event',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  target_type!: string;

  @ApiProperty({
    description: 'The target ID of the event',
    type: Number,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  target_id!: number;

  @ApiProperty({
    description: 'The model type related to the event',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  model_type!: string;

  @ApiProperty({
    description: 'The model ID related to the event',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  model_id!: number | null;

  @ApiProperty({
    description: 'The fields involved in the action event',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  fields!: string;

  @ApiProperty({
    description: 'The status of the action event',
    type: String,
    default: 'running',
  })
  @Default('running')
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  status!: string;

  @ApiProperty({
    description: 'The exception details of the action event',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  exception!: string;

  @ApiProperty({
    description: 'The original data involved in the action event',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  original!: string | null;

  @ApiProperty({
    description: 'The changes made during the action event',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  changes!: string | null;
}
