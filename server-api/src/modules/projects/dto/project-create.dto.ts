import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray } from 'class-validator';
import ProjectProducts from 'src/database/models/project-products.model';

class InternalDescription {
  id: number;
  label: string;
  is_active: boolean;
}

class AdditionalCost {
  id: number;
  label: string;
  value: number;
  is_active: boolean;
}
export class CreateProjectDto {
  @ApiProperty({
    description: 'Name of the project',
    example: 'New Project',
  })
  name: string;

  @ApiProperty({
    description: 'End date of the project in YYYY-MM-DD format',
    example: '2024-12-31',
    required: false,
  })
  end_on?: string;

  @ApiProperty({
    description: 'Custom number for the project',
    example: 'PRJ-001',
    required: false,
  })
  number?: string;

  @ApiProperty({
    description: 'Flag to determine if the project is internal',
    example: true,
  })
  is_internal: boolean;

  @ApiProperty({
    description: 'Customer information with ID',
    example: { id: 1 },
  })
  customer: { id: number };

  @ApiProperty({
    description: 'Assignee information with ID',
    example: { id: 2 },
    required: false,
  })
  assignee?: { id: number };

  @ApiPropertyOptional({
    description: "Project's quote items",
  })
  @IsArray()
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quote_items?: ProjectProducts[];

  @ApiPropertyOptional({
    description: "Project's selected kilometers",
  })
  @IsOptional()
  km_dropdown?: {
    label: string;
    value: number;
  };

  @ApiPropertyOptional({
    description: "Project's internal description",
    type: [InternalDescription],
    example: [
      {
        label: 'Nach Baukosten',
        is_active: true,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  internal_desc?: InternalDescription[];

  @ApiPropertyOptional({
    description: "Project's additional cost",
    type: [AdditionalCost],
  })
  @IsArray()
  @IsOptional()
  additional_cost?: AdditionalCost[];
}
