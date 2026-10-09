import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Default } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import Task from './task.model';

@Table({
  tableName: 'work_items',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['user_id'] },
    { fields: ['project_id'] },
    { fields: ['product_id'] },
    { fields: ['task_id'] },
  ],
})
export default class WorkItem extends Model<WorkItem> {
  @ApiProperty({
    description: 'The unique identifier of the work item',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the work item',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the user associated with the work item',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id!: number | null;

  @ApiProperty({
    description: 'The ID of the project associated with the work item',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  project_id!: number | null;

  @ApiProperty({
    description: 'The ID of the product associated with the work item',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  product_id!: number | null;

  @ApiProperty({
    description: 'The ID of the task associated with the work item',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  task_id!: number | null;

  @ApiProperty({
    description: 'Indicates if the work item is hidden',
    type: Boolean,
    default: false,
  })
  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  is_hide!: boolean;

  @ApiProperty({
    description: 'The timestamp when the work item was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the work item was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the work item was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  tasks?: Task;
}
