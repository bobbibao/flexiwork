import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: 'The ID of the project', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  project_id: number;

  @ApiProperty({ description: 'Name of the task', example: 'Design Homepage' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Status ID of the task', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  status_id: number;

  @ApiProperty({ description: 'Product of the task', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  product_id: number;


  @ApiProperty({ description: 'Priority of the task', type: Number, example: 1 })
  @IsNotEmpty()
  priority_id: number;

  @ApiProperty({ description: 'List of assignee IDs', type: [Number], example: [5, 6] })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  assignee_to: number[];

  @ApiProperty({ description: 'Due date of the task', example: '2024-12-31' })
  @IsDateString()
  @IsNotEmpty()
  due_date: string;

  @ApiProperty({ description: 'Input data for the task', example: '{"input": "data"}' })
  @IsString()
  @IsNotEmpty()
  input_data: string;

  @ApiProperty({ description: 'Output data for the task', example: '{"output": "data"}' })
  @IsString()
  @IsNotEmpty()
  output_data: string;

  @ApiProperty({ description: 'Description of the task', example: 'This task involves designing the homepage.' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ description: 'Parent task ID, null if no parent task', example: null, nullable: true })
  @IsNumber()
  @IsOptional()
  parent_task_id: number | null;
}
