import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { seedData } from '../seeders';

@Table({
  tableName: 'config',
})
export default class Config extends Model {
  @ApiProperty({
    name: 'id',
    description: 'The unique identifier of the configuration entry',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  public Id!: number;

  @ApiProperty({
    name: 'configKey',
    description: 'The key of the configuration entry',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  public ConfigKey!: string;

  @ApiProperty({
    name: 'configValue',
    description: 'The value of the configuration entry',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  public ConfigValue!: string;

  public static async seedData(): Promise<void> {
    seedData();
  }
}
