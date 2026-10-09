export class ProjectStatsDto {
  id: number = 0;
  company: string = '';
  name: string = '';
  project_nbr: string = '';
  project_time: number = 0;
  productive_hours: number = 0;
  unproductive_hours: number = 0;
  revenue: number = 0;
  invoiced: number = 0;
  uninvoiced: number = 0;
  total_hours: number = 0;
  total_cost_to_hours: number = 0;
}

export class ProjectStatsDetailDto {
  position: string = '';
  total_sum: number = 0;
  hours_project: number = 0;
  hours_noted: number = 0;
  hours_available: number = 0;
}

export class ProjectStatsDetailResponseDto {
  name: string = ''; // Response require attribute 'position' name to be 'name'
  total_sum: number = 0;
  hours_project: number = 0;
  hours_noted: number = 0;
  hours_available: number = 0;
}

export class CompanyStatsDto {
  company_name: string = '';
  stats: ProjectStatsDetailResponseDto[] = [];
}
