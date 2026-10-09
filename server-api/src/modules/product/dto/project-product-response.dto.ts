import { ApiProperty } from '@nestjs/swagger';

export class ProjectProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class ProductTasksResponseDto {
  @ApiProperty()
  name: string;
}
