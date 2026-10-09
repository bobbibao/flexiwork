import { ValidateNested } from 'class-validator';
import User from 'src/database/models/users.model';
interface EmployeeProjectDto {
  number: string;

  name: string;

  product_id: number;

  task: string;

  is_internal: boolean;

  hours: number;
}

export class EmployeeProjectsResponseDto {
  @ValidateNested({ each: true })
  billable: EmployeeProjectDto[];

  @ValidateNested({ each: true })
  internal: EmployeeProjectDto[];

  @ValidateNested({ each: true })
  holiday: EmployeeProjectDto[];

  user: User;
}
