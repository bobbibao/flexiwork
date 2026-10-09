import { Provider } from '@nestjs/common';
import EmployerProfile from 'src/database/models/employer-profiles.model';
import WorkLocation from 'src/database/models/work-locations.model';

export const employerProfileProvider: Provider[] = [
  { provide: 'EMPLOYER_PROFILE_REPOSITORY', useValue: EmployerProfile },
  { provide: 'WORK_LOCATION_REPOSITORY', useValue: WorkLocation },
];
