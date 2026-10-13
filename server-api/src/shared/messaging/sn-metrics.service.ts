import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { UnitOfWork } from '../event-store/unit-of-work';
import { runsBackground, snConfig } from '../sn-runtime';

/**
 * Periodic health line for the background role (docs/ARCHITECTURE.md §18 observability):
 * outbox backlog + oldest age, open DLQ messages, open exception cases, shift streams (last 24h) ahead of shift_views.
 * A structured log line rather than a metrics endpoint; a Prometheus exporter can read the same queries later.
 */
@Injectable()
export class SnMetricsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('sn-metrics');
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly uow: UnitOfWork) {}

  onApplicationBootstrap() {
    if (!runsBackground()) return;
    this.timer = setInterval(() => this.report().catch((e) => this.logger.warn(`metrics query failed: ${e}`)), snConfig().SN_METRICS_INTERVAL_SEC * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async snapshot(): Promise<Record<string, number>> {
    const [row] = await this.uow.execute(
      `SELECT
         (SELECT count(*) FROM outbox_messages WHERE published_at IS NULL)::int AS outbox_pending,
         COALESCE((SELECT EXTRACT(EPOCH FROM now() - min(created_at)) FROM outbox_messages WHERE published_at IS NULL), 0)::int AS outbox_oldest_sec,
         (SELECT count(*) FROM dlq_messages WHERE status = 'OPEN')::int AS dlq_open,
         (SELECT count(*) FROM exception_cases WHERE status = 'OPEN')::int AS exceptions_open,
         (SELECT count(*) FROM (SELECT stream_id, max(stream_version) AS v FROM event_store
            WHERE stream_type = 'shift' AND occurred_at > now() - interval '1 day' GROUP BY stream_id) s
            LEFT JOIN shift_views sv ON sv.id = s.stream_id
            WHERE sv.id IS NULL OR sv.version < s.v)::int AS shift_views_behind`,
      {},
      null,
      true,
    );
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
  }

  private async report() {
    const m = await this.snapshot();
    const line = Object.entries(m).map(([k, v]) => `${k}=${v}`).join(' ');
    if (m.dlq_open > 0 || m.outbox_oldest_sec > 300) this.logger.warn(line);
    else this.logger.log(line);
  }
}
