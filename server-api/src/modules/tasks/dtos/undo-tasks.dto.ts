import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class UndoTasksDto {
    @ApiProperty({ description: 'IDs of the tasks', example: [1, 2, 3] })
    @IsArray()
    @IsNotEmpty()
    task_ids: number[];
}