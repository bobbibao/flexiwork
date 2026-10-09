import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty } from "class-validator";

export class PullProjectsDto {
  @ApiProperty({
    description: 'List of project ids',
  })
  @IsArray()
  @IsNotEmpty()
  project_ids: number[]
}