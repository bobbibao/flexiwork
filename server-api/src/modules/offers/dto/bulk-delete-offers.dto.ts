import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class BulkDeleteOffersDto {
  @ApiProperty({ description: 'List of offers IDs', type: Number, isArray: true })
  @IsArray()
  @IsNotEmpty()
  ids: number[];
}
