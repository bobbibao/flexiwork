import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User role' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ description: 'User max work hours per day' })
  @IsString()
  @IsNotEmpty()
  max_work_hours_per_day: number;

  @ApiPropertyOptional({ description: 'User address' })
  @IsString()
  @IsOptional()
  address: string;

  @ApiPropertyOptional({ description: 'User date of birth' })
  @IsString()
  @IsOptional()
  dob: string;

  @ApiPropertyOptional({ description: 'User end work date' })
  @IsString()
  @IsOptional()
  end_work_date: string;

  @ApiPropertyOptional({ description: 'User job' })
  @IsString()
  @IsOptional()
  job: string;

  @ApiPropertyOptional({ description: 'User name' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'User phone' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'User place' })
  @IsString()
  @IsOptional()
  place: string;

  @ApiPropertyOptional({ description: 'User postcode' })
  @IsString()
  @IsOptional()
  postcode: string;

  @ApiPropertyOptional({ description: 'User start work date' })
  @IsString()
  @IsOptional()
  start_work_date: string;

  @ApiPropertyOptional({ description: 'User first name' })
  @IsString()
  @IsOptional()
  first_name: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsString()
  @IsOptional()
  last_name: string;

  @ApiPropertyOptional({ description: 'User holidays' })
  @IsNumber()
  @IsOptional()
  holidays: number;

  @ApiProperty({ description: 'User work percent per week' })
  @IsNumber()
  @IsNotEmpty()
  work_percent_per_week: number;

  @ApiPropertyOptional({ description: 'Holiday periods' })
  @IsString()
  @IsOptional()
  holiday_periods: string;
}
