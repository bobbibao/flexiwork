import { ApiProperty } from '@nestjs/swagger';
import { InvoiceDetailDto } from 'src/modules/invoices/dto/invoice-detail.dto';

export class ProjectReportDto {
  @ApiProperty({
    description: 'Unique identifier for the project',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Name of the project',
    example: 'Project Alpha',
  })
  name: string;

  @ApiProperty({
    description: 'Logged hours for the project',
    example: 100.5,
  })
  logged_hours: number;

  @ApiProperty({
    description: 'Detailed cost breakdown for the project',
    example: {
      total_cost: 1000,
      breakdown: {
        material: 300,
        labor: 700,
      },
    },
  })
  DetailCost: {
    total_cost: number;
    breakdown: {
      material: number;
      labor: number;
    };
  };

  @ApiProperty({
    description: 'Array of invoices related to the project',
    type: [InvoiceDetailDto], // Reference another DTO for invoice details
  })
  Invoices: InvoiceDetailDto[];
}
