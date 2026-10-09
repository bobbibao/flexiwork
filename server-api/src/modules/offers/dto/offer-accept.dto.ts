import { ApiProperty } from '@nestjs/swagger';

export class AcceptOfferDto {
  @ApiProperty({
    description: 'The end date of the project in ISO format',
    example: '2024-12-31T00:00:00Z',
  })
  end_on: string;
}
