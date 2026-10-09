import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTimeSheetPeriodDto {
  @ApiPropertyOptional({ description: 'Actual hours work per day' })
  @IsNumber()
  @IsOptional()
  actual_hours_per_day?: number;

  @ApiPropertyOptional({ description: 'Actual planning per day' })
  @IsNumber()
  @IsOptional()
  actual_planning_per_day?: number;

  @ApiPropertyOptional({ description: 'End date' })
  @IsString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Latest flex hours' })
  @IsNumber()
  @IsOptional()
  latest_flex_hours?: number;

  @ApiPropertyOptional({ description: 'Planning percent' })
  @IsNumber()
  @IsOptional()
  planning_percent?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Work percent' })
  @IsNumber()
  @IsOptional()
  work_percent?: number;
}
