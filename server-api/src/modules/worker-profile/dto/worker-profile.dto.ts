import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNumber, IsObject, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';

export class BankAccountDto {
  @ApiPropertyOptional({ example: 'Vietcombank' })
  @IsString()
  @Length(2, 80)
  bank_name: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsString()
  @Length(4, 30)
  account_number: string;

  @ApiPropertyOptional({ example: 'NGUYEN VAN AN' })
  @IsString()
  @Length(2, 120)
  account_holder: string;
}

export class UpdateWorkerProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn An' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  full_name?: string;

  @ApiPropertyOptional({ example: '2000-05-20' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ example: ['phuc_vu', 'pha_che'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skill_codes?: string[];

  @ApiPropertyOptional({ example: 10.7769 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  home_lat?: number;

  @ApiPropertyOptional({ example: 106.7009 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  home_lng?: number;

  @ApiPropertyOptional({ example: 'Phường Bến Thành, TP. Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  home_address?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  radius_km?: number;

  @ApiPropertyOptional({ example: { weekdays: [1, 2, 3, 4, 5], from: '17:00', to: '23:00' } })
  @IsOptional()
  @IsObject()
  availability?: Record<string, unknown>;

  @ApiPropertyOptional({ type: BankAccountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDto)
  bank_account?: BankAccountDto;
}
