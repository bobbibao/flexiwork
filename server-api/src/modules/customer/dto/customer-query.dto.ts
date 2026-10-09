import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCustomersRequestDto {
  @ApiPropertyOptional({
    description: 'Category of the customers to filter by (e.g., customer, supplier, acquisition)',
    example: 'customer',
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Type of the customers to filter by',
    example: 'individual',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    type: Number,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination',
    example: 20,
    type: Number,
  })
  page_size?: number;

  @ApiPropertyOptional({
    description: 'Sorting criteria for the customers',
    example: 'name:asc',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: 'Search term to filter the customers by name, email, phone, or address',
    example: 'john doe',
  })
  search?: string;
}
