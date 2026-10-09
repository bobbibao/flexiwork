import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './shared/utils/configuration';
import { ShiftNetworkModule } from './modules/shift-network/shift-network.module';

const ENV_FOLDER_PATH = process.env.ENV_PATH ? process.env.ENV_PATH : `${process.cwd()}/env`;

/** Worker role (docs/ARCHITECTURE.md §3.3): no legacy modules, no HTTP. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${ENV_FOLDER_PATH}/${process.env.NODE_ENV}.env`,
      load: [configuration],
    }),
    ShiftNetworkModule,
  ],
})
export class WorkerModule {}
