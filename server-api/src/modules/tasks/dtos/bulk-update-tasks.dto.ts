import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber } from "class-validator";

export class BulkUpdateTasksDto {
  @ApiProperty({ description: 'List of task IDs' })
  @IsArray()
  @IsNotEmpty()
  ids: number[];

  @ApiProperty({ description: 'Status ID of the task' })
  @IsNumber()
  @IsNotEmpty()
  status_id: number;
}