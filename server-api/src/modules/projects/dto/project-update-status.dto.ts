import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectStatusDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of project IDs',
  })
  ids: number[];

  @ApiProperty({
    description: 'The status to update the project to. Valid values are: active, archive',
    example: 'active',
  })
  status: string;
}
