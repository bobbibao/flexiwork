process.env.APP_ROLE = 'tool';

import { NestFactory } from '@nestjs/core';
import { Logger, Type } from '@nestjs/common';
import { WorkerModule } from '../../worker.module';
import { UnitOfWork } from '../event-store/unit-of-work';
import { toEnvelope } from '../event-store/event-store.service';
import { BaseProjector } from './base-projector';
import { ShiftViewProjector } from '../../modules/shift/infrastructure/shift-view.projector';

/**
 * Rebuilds a Postgres read model by replaying event_store from position 0 (docs/ARCHITECTURE.md §7.4).
 * Usage: yarn sn:rebuild-projection [projection-name]   (default: shift-view)
 * Runs as APP_ROLE=tool, so no relay / consumer / timer starts. Stop the projection's live consumer first
 * or run during a quiet window; each handler is version-guarded so overlapping live updates are harmless.
 */
const PROJECTORS: Record<string, Type<BaseProjector>> = {
  'shift-view': ShiftViewProjector,
};

const BATCH = 500;

async function main() {
  const logger = new Logger('rebuild-projection');
  const name = process.argv[2] || 'shift-view';
  const projectorType = PROJECTORS[name];
  if (!projectorType) {
    logger.error(`unknown projection "${name}". Known: ${Object.keys(PROJECTORS).join(', ')}`);
    process.exit(2);
  }
  const app = await NestFactory.createApplicationContext(WorkerModule, { logger: ['log', 'error', 'warn'] });
  const uow = app.get(UnitOfWork, { strict: false });
  const projector = app.get(projectorType, { strict: false });

  await projector.reset();
  let position = 0;
  let total = 0;
  for (;;) {
    const rows = await uow.execute(
      `SELECT * FROM event_store WHERE global_position > :position ORDER BY global_position ASC LIMIT :limit`,
      { position, limit: BATCH },
      null,
      true,
    );
    if (!rows.length) break;
    for (const row of rows) {
      const env = toEnvelope(row);
      await projector.project(env, null);
      position = Number(row.global_position);
      total++;
    }
  }
  await uow.execute(
    `INSERT INTO projection_checkpoints (projection_name, last_global_position, updated_at) VALUES (:name, :position, now())
     ON CONFLICT (projection_name) DO UPDATE SET last_global_position = EXCLUDED.last_global_position, updated_at = now()`,
    { name, position },
  );
  logger.log(`rebuilt "${name}" from ${total} events (last global_position ${position})`);
  await app.close();
}

main().catch((err) => {
  new Logger('rebuild-projection').error(`${err}`, err?.stack);
  process.exit(1);
});
