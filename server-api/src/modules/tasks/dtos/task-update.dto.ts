import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsArray } from 'class-validator';

export class UpdateTaskDto {
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

  @ApiProperty({ description: 'Priority of the task', type: Number, example: 1 })
  @IsNotEmpty()
  priority_id: number;

  @ApiProperty({ description: 'ID of the assignees', example: [1, 2, 3] })
  @IsArray()
  @IsNotEmpty()
  assignee_to: number[];

  @ApiProperty({ description: 'Due date of the task', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  due_date: Date;

  @ApiProperty({ description: 'Product ID associated with the task', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ description: 'Input data for the task', example: 'abc.com/a.pdf' })
  @IsString()
  @IsNotEmpty()
  input_data: string;

  @ApiProperty({ description: 'Output data for the task', example: 'abc.com/a.docx' })
  @IsString()
  @IsNotEmpty()
  output_data: string;

  @ApiProperty({ description: 'Description of the task', example: 'This task involves designing the homepage.' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ description: 'Parent task ID, null if no parent task', example: 10, nullable: true })
  @IsNumber()
  @IsOptional()
  parent_task_id: number;
}
