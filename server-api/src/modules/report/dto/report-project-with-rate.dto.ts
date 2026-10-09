import { ApiProperty } from '@nestjs/swagger';

export class ProjectWithRateReportDto {
  @ApiProperty({ description: 'Unique identifier for the project' })
  id: number;

  @ApiProperty({ description: 'Project number' })
  number: string;

  @ApiProperty({ description: 'Project name' })
  name: string;

  @ApiProperty({ description: 'Product name associated with the project' })
  product_name: string;

  @ApiProperty({ description: 'Task name' })
  task: string;

  @ApiProperty({ description: 'Job description' })
  job: string;

  @ApiProperty({ description: 'Staff member name associated with the project' })
  staff_name: string;

  @ApiProperty({ description: 'Unique identifier for the staff member' })
  staff_id: number;

  @ApiProperty({ description: 'Rate for the project' })
  rate: number;

  @ApiProperty({ description: 'Date of the report' })
  date: Date;

  @ApiProperty({ description: 'Time spent in hours', example: 3.5 })
  hours: number;

  @ApiProperty({ description: 'Additional comments' })
  comment: string;
}

export interface ProjectWithRateReportInterface {
  id: number;
  number: string;
  name: string;
  product_name: string;
  task: string;
  job: string;
  staff_name: string;
  staff_id: number;
  rate: number;
  date: Date;
  spent_in_hours: number;
  spent: string;
  comment: string;
}
