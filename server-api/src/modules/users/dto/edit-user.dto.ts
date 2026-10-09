import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EditUserDto {
  @ApiPropertyOptional({
    description: 'User role',
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    description: 'User max work hours per day',
  })
  @IsNumber()
  @IsOptional()
  max_work_hours_per_day?: number;

  @ApiPropertyOptional({
    description: 'User max work hours per week',
  })
  @IsNumber()
  @IsOptional()
  max_work_hours_per_week?: number;

  @ApiPropertyOptional({
    description: 'User address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'User DOB',
  })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({
    description: 'User end work date',
  })
  @IsString()
  @IsOptional()
  end_work_date?: string;

  @ApiPropertyOptional({
    description: 'User job',
  })
  @IsString()
  @IsOptional()
  job?: string;

  @ApiPropertyOptional({
    description: 'User name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'User place',
  })
  @IsString()
  @IsOptional()
  place?: string;

  @ApiPropertyOptional({
    description: 'User postcode',
  })
  @IsString()
  @IsOptional()
  postcode?: string;

  @ApiPropertyOptional({
    description: 'User start work date',
  })
  @IsString()
  @IsOptional()
  start_work_date?: string;

  @ApiPropertyOptional({
    description: 'User max percent per week',
  })
  @IsNumber()
  @IsOptional()
  max_percent_per_week?: number;

  @ApiPropertyOptional({
    description: 'User first name',
  })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({
    description: 'User last name',
  })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({
    description: 'User holidays',
  })
  @IsNumber()
  @IsOptional()
  holidays?: number;

  @ApiPropertyOptional({
    description: 'User holiday periods',
  })
  @IsString()
  @IsOptional()
  holiday_periods?: string;

  @ApiPropertyOptional({
    description: 'User phone',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
