import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsArray } from 'class-validator';

export class InvoiceReportDto {
  @ApiPropertyOptional({ description: 'Status of the invoice' })
  @IsArray()
  @IsOptional()
  status?: string[];

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsDateString()
  @IsOptional()
  start?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsDateString()
  @IsOptional()
  end?: string;

  @ApiPropertyOptional({ description: 'Customer IDs' })
  @IsArray()
  @IsOptional()
  customer?: string[];
}
