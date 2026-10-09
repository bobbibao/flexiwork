import { Global, Inject, Injectable, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { SN_SHIFTS_INDEX } from './indices/sn-shifts.index';
import { SN_WORKERS_INDEX } from './indices/sn-workers.index';
import { runsBackground, snConfig } from '../sn-runtime';

export const ES_CLIENT = 'ES_CLIENT';

const INDICES = [SN_SHIFTS_INDEX, SN_WORKERS_INDEX];

/** Index naming: <prefix>_<alias>_v<version> behind alias <prefix>_<alias>. */
export const indexAlias = (alias: string) => `${snConfig().ES_INDEX_PREFIX}_${alias}`;
const indexName = (alias: string, version: number) => `${indexAlias(alias)}_v${version}`;

/** Creates versioned indexes + aliases on worker boot (docs/ARCHITECTURE.md §9.5). */
@Injectable()
export class IndexManagerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IndexManagerService.name);

  constructor(@Inject(ES_CLIENT) private readonly es: Client | null) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.es || !runsBackground()) return;
    try {
      await this.ensure();
    } catch (err) {
      this.logger.error(`could not ensure indices (search falls back to Postgres): ${err}`);
    }
  }

  async ensure(versionOverride?: number): Promise<void> {
    if (!this.es) return;
    for (const def of INDICES) {
      const name = indexName(def.alias, versionOverride ?? def.version);
      if (!(await this.es.indices.exists({ index: name }))) {
        await this.es.indices.create({ index: name, ...(def.body as any) });
        this.logger.log(`created index ${name}`);
      }
      const alias = indexAlias(def.alias);
      if (!(await this.es.indices.existsAlias({ name: alias }))) {
        await this.es.indices.putAlias({ index: name, name: alias });
      }
    }
    this.logger.log('indices ensured');
  }
}

@Global()
@Module({
  providers: [
    {
      provide: ES_CLIENT,
      useFactory: () => {
        const cfg = snConfig();
        if (cfg.SEARCH_DRIVER !== 'elasticsearch') return null;
        return new Client({ node: cfg.ES_NODE, requestTimeout: 3000 });
      },
    },
    IndexManagerService,
  ],
  exports: [ES_CLIENT, IndexManagerService],
})
export class SearchModule {}
