import { ApiProperty } from '@nestjs/swagger';
import { CompanyEntityDto } from './company-entity.dto';

export class CompanyShareDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  signature: string;

  @ApiProperty()
  company: CompanyEntityDto;

  @ApiProperty()
  created_at: string;
}
