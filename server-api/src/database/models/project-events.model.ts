import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import ProjectDetails from './project-details.model';

@Table({
  tableName: 'project_events',
  timestamps: false,
  indexes: [{ fields: ['project_id'] }],
})
export default class ProjectEvents extends Model<ProjectEvents> {
  @ApiProperty({ description: 'The unique identifier of the event', type: Number })
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @ForeignKey(() => ProjectDetails)
  @Column({ type: DataType.INTEGER })
  project_id!: number;

  @BelongsTo(() => ProjectDetails)
  projectDetails!: ProjectDetails;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  label!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  value!: string | null;
}
