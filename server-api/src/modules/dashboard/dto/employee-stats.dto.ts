import { ApiProperty } from '@nestjs/swagger';

export class EmployeeStatsQuery {
  @ApiProperty({ description: 'Submit Start Date', required: true })
  start: string;

  @ApiProperty({ description: 'Submit End Date', required: true })
  end: string;

  @ApiProperty({ description: "Current company's id", required: true })
  company_id: number;
}

export class EmployeeStatsResponseDto {
  id: number;
  first_name: string;
  last_name: string;
  billable_hours: number;
  unbillable_hours: number;
  total_hours: number;
  logged_hours: number;
}

export class TotalHoursLoggedByUserDto {
  first_name: string;
  last_name: string;
  hours_noted: number;
}
