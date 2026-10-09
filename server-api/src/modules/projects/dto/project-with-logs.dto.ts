export class ProjectWithLogsDto {
  id: number;
  name: string;
  location: string;
  number: string;
}

export class ProjectWithLogsDetailsDto extends ProjectWithLogsDto {
  status: string;
}
