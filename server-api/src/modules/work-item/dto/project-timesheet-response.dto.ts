import { ApiProperty } from '@nestjs/swagger';

export class ProjectTimeSheetResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  date: string;

  @ApiProperty()
  is_internal: boolean;

  @ApiProperty()
  is_connected: boolean;

  @ApiProperty()
  company_id: number;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  end_on: string;

  @ApiProperty()
  updated_at: string;
}
