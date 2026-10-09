export interface IQueryProject {
  page?: number | string;
  page_size?: number | string;
  sort?: string;
  status?: string;
  search?: string;
}
export interface Project {
  id: number;
  currency: string;
  name: string;
  status: string;
}

export interface CreateProjectDto extends Partial<Omit<Project, "id">> {}

export interface UpdateProjectDto extends Partial<Project> {}
