import { Provider } from '@nestjs/common';
import ShiftView from 'src/database/models/shift-views.model';
import { WORK_LOCATION_READER, WORKER_DIRECTORY } from './application/ports/shift.ports';
import { EmployerWorkLocationReader, ProfileWorkerDirectory } from './infrastructure/profile.adapters';

export const shiftProvider: Provider[] = [
  { provide: 'SHIFT_VIEW_REPOSITORY', useValue: ShiftView },
  EmployerWorkLocationReader,
  ProfileWorkerDirectory,
  { provide: WORK_LOCATION_READER, useExisting: EmployerWorkLocationReader },
  { provide: WORKER_DIRECTORY, useExisting: ProfileWorkerDirectory },
];
