import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserDetailQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in YYYY-MM-DD format',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({
    description: 'End date in YYYY-MM-DD format',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  end?: string;
}
