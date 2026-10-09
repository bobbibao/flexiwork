import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import User from './users.model';
import Project from './projects.model';

@Table({
  tableName: 'project_comments',
})
export default class ProjectComment extends Model<ProjectComment> {
  @ApiProperty({
    description: 'The unique identifier of the project comment',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the project associated with the comment',
    type: Number,
  })
  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id!: number;

  @ApiProperty({
    description: 'The content of the project comment',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comment!: string | null;

  @ApiProperty({
    description: 'The timestamp when the comment was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;

  @ApiProperty({
    description: 'The user ID who created the comment',
    type: Number,
    nullable: true,
  })
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  created_by!: number | null;

  @BelongsTo(() => User, 'created_by')
  creator!: User;

  @BelongsTo(() => Project, 'project_id')
  project!: Project;
}
