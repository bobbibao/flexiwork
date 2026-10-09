import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { TaskState } from '.';
import Project from './projects.model';
import WorkItem from './work-items.model';

@Table({
  tableName: 'tasks',
  indexes: [
    { fields: ['project_id'] },
    { fields: ['product_id'] },
    { fields: ['parent_task_id'] },
    { fields: ['created_by'] },
    { fields: ['deleted_by'] },
  ],
})
export default class Task extends Model<Task> {
  @ApiProperty({
    description: 'Unique identifier for the task',
    type: Number,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ApiProperty({
    description: 'Parent task ID if this task is a sub-task',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  parent_task_id!: number | null;

  @ApiProperty({
    description: 'Project ID associated with the task',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id!: number;

  @ApiProperty({
    description: 'Project associated with the task',
    type: [Project],
    nullable: true,
  })
  project!: Project;

  @ApiProperty({
    description: 'Name of the task',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  name!: string;

  @ApiProperty({
    description: 'Description of the task',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Status ID of the task',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  status_id!: number;

  @ApiProperty({
    description: 'Task state',
    type: Object,
    nullable: true,
  })
  task_status!: TaskState;

  @ApiProperty({
    description: 'Priority of the task',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  priority_id!: number;

  @ApiProperty({
    description: 'Task priority',
    type: Object,
    nullable: true,
  })
  task_priority!: TaskState;

  @ApiProperty({
    description: 'Product ID associated with the task',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  product_id!: number | null;

  @ApiProperty({
    description: 'Due date of the task',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date!: Date | null;

  @ApiProperty({
    description: 'Input data related to the task',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  input_data!: string | null;

  @ApiProperty({
    description: 'Output data related to the task',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  output_data!: string | null;

  @ApiProperty({
    description: 'User ID who created the task',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  created_by!: number;

  @ApiProperty({
    description: 'Timestamp when the task was created',
    type: Date,
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  @ApiProperty({
    description: 'User ID who last updated the task',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  updated_by!: number | null;

  @ApiProperty({
    description: 'Timestamp when the task was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null;

  @ApiProperty({
    description: 'Timestamp when the task was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  @ApiProperty({
    description: 'User ID who deleted the task',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  deleted_by!: number | null;

  work_items?: WorkItem[];
}
