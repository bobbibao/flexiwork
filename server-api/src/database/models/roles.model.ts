import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import AccessControl from './access-controls.model';

@Table({
  tableName: 'roles',
  timestamps: false,
})
export default class Role extends Model<Role> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  @CreatedAt
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  @UpdatedAt
  updated_at!: Date;

  @HasMany(() => AccessControl)
  accessControls?: Partial<AccessControl>[];
}
