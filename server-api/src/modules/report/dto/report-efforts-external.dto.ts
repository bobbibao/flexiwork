import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class EffortsExternalDto {
  @ApiPropertyOptional({ description: 'Id of the company' })
  @IsNumber()
  company_id: number;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsDateString()
  end?: string;
}
