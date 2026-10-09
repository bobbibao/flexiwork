import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ProjectsWithLogsQueryDto {
  @ApiProperty({
    description: 'Start date in the format YYYY-MM-DD',
    example: '2024-01-01',
  })
  @IsDateString()
  start: string;

  @ApiProperty({
    description: 'End date in the format YYYY-MM-DD',
    example: '2024-01-31',
  })
  @IsDateString()
  end: string;

  @ApiPropertyOptional({
    description: 'Project status to filter by (optional)',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Comma-separated list of company IDs',
    example: '1,2,3',
    required: false,
  })
  @IsOptional()
  @IsString()
  company_id?: string;
}
