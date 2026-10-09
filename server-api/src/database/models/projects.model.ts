import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, HasOne, HasMany } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import Task from './task.model';
import NumberEntry from './numbers.model';
import ProjectDetails from './project-details.model';
import ProjectComment from './project-comments.model';

@Table({
  tableName: 'projects',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['customer_id'] },
    { fields: ['assignee_id'] },
    { fields: ['offer_id'] },
    { fields: ['number_id'] },
  ],
})
export default class Project extends Model<Project> {
  @ApiProperty({
    description: 'The unique identifier of the project',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The name of the project',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The status of the project',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  status!: string | null;

  @ApiProperty({
    description: 'The ID of the company associated with the project',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the customer associated with the project',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  customer_id!: number | null;

  @ApiProperty({
    description: 'The ID of the assignee (user) associated with the project',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  assignee_id!: number | null;

  @ApiProperty({
    description: 'The ID of the offer associated with the project',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  offer_id!: number | null;

  @ApiProperty({
    description: 'The number ID associated with the project',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  number_id!: number | null;

  @ApiProperty({
    description: 'The number associated with the project',
    type: NumberEntry,
    nullable: true,
  })
  number!: NumberEntry;

  @ApiProperty({
    description: 'The indentation associated with the project',
    type: String,
    nullable: true,
  })
  project_nbr?: string;

  @ApiProperty({
    description: 'The tasks associated with the project',
    type: [Task],
    nullable: true,
  })
  tasks!: Task[];

  @ApiProperty({
    description: 'The end date of the project',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end_on!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the project was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the project was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the project was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  @ApiProperty({
    description: 'Flag indicating if the project is internal',
    type: Boolean,
    default: false,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  is_internal!: boolean;

  @ApiProperty({
    description: 'The ID of the user who deleted the project',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  deleted_by!: number | null;

  @HasOne(() => ProjectDetails)
  details!: ProjectDetails;

  @HasMany(() => ProjectComment)
  comments!: ProjectComment[];
}
