import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import ProjectDetails from './project-details.model';

@Table({
  tableName: 'project_additional_costs',
  timestamps: false,
  indexes: [{ fields: ['project_id'] }],
})
export default class ProjectAdditionalCosts extends Model<ProjectAdditionalCosts> {
  @ApiProperty({ description: 'The unique identifier of the additional cost', type: Number })
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
  @Column({ type: DataType.TEXT, allowNull: true })
  label!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  value!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_active!: boolean | null;
}
