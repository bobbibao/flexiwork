import { ApiProperty } from '@nestjs/swagger';

export class CompanyEntityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  signature: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}
