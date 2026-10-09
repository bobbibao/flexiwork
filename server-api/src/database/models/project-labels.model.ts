import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import ProjectDetails from './project-details.model';

@Table({
  tableName: 'project_labels',
  timestamps: false,
  indexes: [{ fields: ['project_id'] }],
})
export default class ProjectLabels extends Model<ProjectLabels> {
  @ApiProperty({ description: 'The unique identifier of the label', type: Number })
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @ForeignKey(() => ProjectDetails)
  @Column({ type: DataType.INTEGER })
  project_id!: number;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  label!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_active!: boolean | null;

  @BelongsTo(() => ProjectDetails)
  projectDetails!: ProjectDetails;
}
