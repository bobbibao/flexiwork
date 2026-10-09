import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import ProjectDetails from './project-details.model';

@Table({
  tableName: 'project_cost_estimates',
  timestamps: false,
  indexes: [{ fields: ['project_id'] }],
})
export default class ProjectCostEstimates extends Model<ProjectCostEstimates> {
  @ApiProperty({ description: 'The unique identifier of the cost estimate', type: Number })
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @ApiProperty({ type: Number })
  @ForeignKey(() => ProjectDetails)
  @Column({ type: DataType.INTEGER })
  project_id!: number;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  label!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  value!: number | null;

  @BelongsTo(() => ProjectDetails)
  projectDetails!: ProjectDetails;
}
