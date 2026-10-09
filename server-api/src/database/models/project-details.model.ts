import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
  ForeignKey,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import Project from './projects.model';
import ProjectEvents from './project-events.model';
import ProjectCostEstimates from './project-cost-estimates.model';
import ProjectLabels from './project-labels.model';
import ProjectAdditionalCosts from './project-additional-costs.model';
import ProjectProducts from './project-products.model';

@Table({
  tableName: 'project_details',
  timestamps: false,
  indexes: [{ fields: ['project_id'] }],
})
export default class ProjectDetails extends Model<ProjectDetails> {
  @ApiProperty({
    description: 'The unique identifier of the project details',
    type: Number,
  })
  @ForeignKey(() => Project)
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  project_id!: number;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  end!: string | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  date!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  begin!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  event!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  offer!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  title!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  category!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(3), allowNull: true })
  currency!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  duration!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  end_desc!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  location!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  parameter!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  additional!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  begin_desc!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  offer_desc!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  begin_break!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  event_break!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  offer_break!: boolean | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  performance!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  estimate_cost!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  parameter_desc!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  additional_desc!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  parameter_break!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  additional_break!: boolean | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.FLOAT, allowNull: true })
  discount_percent!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  performance_desc!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  offer_quote_break!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  performance_break!: boolean | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  internal_desc_custom!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  name!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  address!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  only_my_company!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_internal!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  pr_begin_break!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  pr_quote_break!: boolean | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  rate_per_hour!: number | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  end_on!: Date | null;

  @ApiProperty({ type: Object, nullable: true })
  @Column({ type: DataType.JSONB, allowNull: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cost_generation!: Record<string, any> | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  selected_km_label!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  selected_km_value!: number | null;

  @BelongsTo(() => Project)
  project!: Project;

  @HasMany(() => ProjectEvents, {
    foreignKey: 'project_id',
    sourceKey: 'project_id',
    as: 'events',
  })
  events!: ProjectEvents[];

  @HasMany(() => ProjectCostEstimates, {
    foreignKey: 'project_id',
    sourceKey: 'project_id',
    as: 'cost_estimate',
  })
  costEstimates!: ProjectCostEstimates[];

  @HasMany(() => ProjectLabels, {
    foreignKey: 'project_id',
    sourceKey: 'project_id',
    as: 'internal_desc',
  })
  labels!: ProjectLabels[];

  @HasMany(() => ProjectAdditionalCosts, {
    foreignKey: 'project_id',
    sourceKey: 'project_id',
    as: 'additional_cost',
  })
  additionalCosts!: ProjectAdditionalCosts[];

  @HasMany(() => ProjectProducts, {
    foreignKey: 'project_id',
    sourceKey: 'project_id',
    as: 'quote_items',
  })
  products!: ProjectProducts[];
}
