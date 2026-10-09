import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListProjectsRequestDto {
  @ApiPropertyOptional({
    description: 'Status of the projects to filter by (e.g., active, deleted, internal)',
    example: 'active',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Company ID to filter the projects',
    example: 1,
    type: Number,
  })
  company_id?: number;

  @ApiPropertyOptional({
    description: 'Is use for project selector or not',
    example: false,
    type: Boolean,
  })
  for_selector?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    type: Number,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination',
    example: 10,
    type: Number,
  })
  page_size?: number;

  @ApiPropertyOptional({
    description: 'Sorting criteria for the projects',
    example: 'created_at:desc',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: 'Search term to filter the projects',
    example: 'project name',
  })
  search?: string;
}
