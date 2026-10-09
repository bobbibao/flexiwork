import Project from 'src/database/models/projects.model';
import { ProjectProductResponseDto } from 'src/modules/product/dto/project-product-response.dto';
import Task from 'src/database/models/task.model';

export class ProductWithTask extends ProjectProductResponseDto {
  tasks: Task[];
}

export class TasksByProjects extends Project {
  products: ProductWithTask[];
}