process.env.APP_ROLE = 'tool';

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from '../../worker.module';
import { IndexManagerService } from './search.module';
import { SearchProjectors } from '../../modules/matching/infrastructure/search.projectors';
import { snConfig } from '../sn-runtime';

/**
 * Backfills the Elasticsearch read models from Postgres (docs/ARCHITECTURE.md §9.5): every worker profile and every
 * open shift. Run once when switching SEARCH_DRIVER to elasticsearch on a database that already has data, or after
 * deleting an index. Live projections keep the documents current afterwards.
 * Usage: yarn sn:reindex-search
 */
async function main() {
  const logger = new Logger('reindex-search');
  if (snConfig().SEARCH_DRIVER !== 'elasticsearch') {
    logger.error('SEARCH_DRIVER is not elasticsearch; nothing to do');
    process.exit(2);
  }
  const app = await NestFactory.createApplicationContext(WorkerModule, { logger: ['log', 'error', 'warn'] });
  await app.get(IndexManagerService, { strict: false }).ensure();
  const projectors = app.get(SearchProjectors, { strict: false });
  const workers = await projectors.reindexWorkers();
  const shifts = await projectors.reindexOpenShifts();
  logger.log(`indexed ${workers} worker profiles and ${shifts} open shifts`);
  await app.close();
}

main().catch((err) => {
  new Logger('reindex-search').error(`${err}`, err?.stack);
  process.exit(1);
});
