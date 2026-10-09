import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'project_pulls',
})
export default class ProjectPull extends Model<ProjectPull> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @ApiProperty({
    description: 'The ID of the company associated with the project pull',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  company_id!: number;

  @ApiProperty({
    description: 'The ID of the project associated with the project pull',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id!: number;

  @ApiProperty({
    description: 'Additional metadata for the project pull',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata!: Record<string, any> | null;
}
