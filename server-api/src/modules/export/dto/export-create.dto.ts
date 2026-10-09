import { ApiProperty } from '@nestjs/swagger';

export class ExportCreateDto {
  @ApiProperty()
  company_id: number;

  @ApiProperty()
  document_id: number;

  @ApiProperty()
  template_id: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  created_at: Date;
}
