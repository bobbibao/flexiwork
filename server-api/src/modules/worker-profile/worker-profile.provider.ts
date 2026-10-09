import { Provider } from '@nestjs/common';
import WorkerProfile from 'src/database/models/worker-profiles.model';

export const workerProfileProvider: Provider[] = [{ provide: 'WORKER_PROFILE_REPOSITORY', useValue: WorkerProfile }];
