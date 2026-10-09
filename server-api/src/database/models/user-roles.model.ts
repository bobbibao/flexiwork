import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import User from './users.model';
import Role from './roles.model';

@Table({
  tableName: 'users_roles',
  timestamps: false,
})
export class UserRoles extends Model<UserRoles> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  @ForeignKey(() => User)
  user_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  @ForeignKey(() => Role)
  role_id!: number;

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
}
