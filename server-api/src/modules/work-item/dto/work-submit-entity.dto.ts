import { ApiProperty, OmitType } from '@nestjs/swagger';

export class WorkSubmitEntityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  start_date: Date | string;

  @ApiProperty()
  end_date: Date | string;

  @ApiProperty()
  metadata: object;
}

export class WorkSubmitResponseDto extends OmitType(WorkSubmitEntityDto, ['metadata']) {
  @ApiProperty()
  email: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;
}
