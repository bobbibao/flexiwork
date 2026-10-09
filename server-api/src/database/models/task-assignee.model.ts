import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'task_assignees',
  indexes: [{ fields: ['task_id'] }, { fields: ['user_id'] }],
})
export default class TaskAssignee extends Model<TaskAssignee> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  task_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.DATE,
    defaultValue: () => new Date(),
  })
  created_at: Date;
}
