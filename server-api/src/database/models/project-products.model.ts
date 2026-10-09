import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import ProjectDetails from './project-details.model';
import Product from './products.model';

@Table({
  tableName: 'project_products',
  timestamps: false,
  indexes: [{ fields: ['project_id'] }],
})
export default class ProjectProducts extends Model<ProjectProducts> {
  @ApiProperty({
    description: 'The unique identifier of the quote item',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ForeignKey(() => ProjectDetails)
  @Column({ type: DataType.INTEGER })
  project_id!: number;

  @ApiProperty({ type: Number, nullable: true })
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: true })
  product_id!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  name!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  cost!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(100), allowNull: true })
  type!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(100), allowNull: true })
  unit!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  quarter!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  year!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(100), allowNull: true })
  uuid!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  price!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  amount!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  break_page!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  optional!: boolean | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  vat_rate!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_nk!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  apply_discount!: boolean | null;

  @BelongsTo(() => ProjectDetails)
  projectDetails?: ProjectDetails;

  @BelongsTo(() => Product)
  product?: Product;
}
