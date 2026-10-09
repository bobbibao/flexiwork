import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty } from "class-validator";

export class BulkDeleteTasksDto {
  @ApiProperty({ description: 'List of task IDs', type: Number , isArray: true })
  @IsArray()
  @IsNotEmpty()
  ids: number[];
}