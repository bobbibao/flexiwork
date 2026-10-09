import { ApiProperty } from '@nestjs/swagger';

export class WorkLogInputDto {
  @ApiProperty()
  work_item_id: number;

  @ApiProperty()
  spent: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  comment: string;
}
