import { ProjectDetailDto } from 'src/modules/projects/dto';

export class ReportProjectWithInvoiceDto {
  project: Partial<ProjectDetailDto>;
  projects: Partial<ProjectDetailDto>[];
}
