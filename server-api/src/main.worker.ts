process.env.APP_ROLE = 'worker';

import { NestFactory } from '@nestjs/core';
import { Logger, LoggerService } from '@nestjs/common';
import { WorkerModule } from './worker.module';
import { FileLogger } from './shared/services/file-logger.service';

/**
 * Worker role entry point (PLAN.md P1.9): outbox relay, Kafka consumers, projections, timers.
 * Unlike main.ts it never logs process.env.
 */
async function bootstrap() {
  const environment = process.env.NODE_ENV || 'development';
  const logger: LoggerService = ['staging', 'production'].includes(environment) ? new FileLogger() : new Logger('worker');
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['staging', 'production'].includes(environment) ? logger : ['log', 'error', 'warn'],
  });
  if ((process.env.MESSAGE_BUS_DRIVER || 'memory') === 'memory') {
    logger.error('MESSAGE_BUS_DRIVER=memory runs everything inside the api process; the worker role needs kafka. Exiting.');
    await app.close();
    process.exit(1);
  }
  app.enableShutdownHooks();
  logger.log(`worker started (${environment})`);
}

bootstrap().catch((err) => {
  new Logger('worker').error(`worker failed to start: ${err}`, err?.stack);
  process.exit(1);
});
