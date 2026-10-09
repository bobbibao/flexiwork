import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Queue, Worker, JobsOptions } from 'bullmq';
import { TIMER_HANDLER_METADATA } from './timer-handler.decorator';
import { ignoreError, runsBackground, snConfig, timerSpeedup } from '../sn-runtime';

const QUEUE_NAME = 'sn-timers';

type TimerFn = (payload: any) => Promise<void>;

/**
 * Durable timers on BullMQ delayed jobs (docs/ARCHITECTURE.md §5.5).
 * Without REDIS_URL, falls back to in-process setTimeout (dev/tests only, not durable).
 * Handlers must re-check aggregate state: a late or duplicate timer must be a no-op.
 */
@Injectable()
export class TimerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TimerService.name);
  private readonly handlers = new Map<string, TimerFn>();
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private readonly memoryTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  private connection() {
    const url = new URL(snConfig().REDIS_URL);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      password: url.password || undefined,
      db: url.pathname && url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0,
      maxRetriesPerRequest: null as null,
    };
  }

  private useRedis(): boolean {
    return !!snConfig().REDIS_URL;
  }

  async onApplicationBootstrap(): Promise<void> {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance;
      if (!instance || typeof instance !== 'object') continue;
      const proto = Object.getPrototypeOf(instance);
      for (const name of this.scanner.getAllMethodNames(proto)) {
        const type = this.reflector.get<string>(TIMER_HANDLER_METADATA, proto[name]);
        if (type) this.handlers.set(type, proto[name].bind(instance));
      }
    }
    if (this.useRedis()) {
      this.queue = new Queue(QUEUE_NAME, { connection: this.connection() });
      if (runsBackground()) {
        this.worker = new Worker(QUEUE_NAME, async (job) => this.run(job.name, job.data), {
          connection: this.connection(),
          concurrency: 5,
        });
        this.worker.on('failed', (job, err) => this.logger.warn(`timer ${job?.name} ${job?.id} failed: ${err.message}`));
        this.logger.log(`timer processor started (${this.handlers.size} handlers)`);
      }
    } else {
      this.logger.warn('REDIS_URL empty: timers use in-process setTimeout (not durable)');
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const t of this.memoryTimers.values()) clearTimeout(t);
    await this.worker?.close().catch(ignoreError);
    await this.queue?.close().catch(ignoreError);
  }

  /** Schedules `type` at `runAt`. The same dedupeKey is only scheduled once. */
  async schedule(type: string, runAt: Date, payload: Record<string, unknown>, dedupeKey: string): Promise<void> {
    const delay = Math.max(0, runAt.getTime() - Date.now()) / timerSpeedup();
    const jobId = sanitize(`${type}__${dedupeKey}`);
    if (this.queue) {
      const opts: JobsOptions = {
        jobId,
        delay: Math.round(delay),
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 7 * 24 * 3600 },
        removeOnFail: { age: 30 * 24 * 3600 },
      };
      await this.queue.add(type, payload, opts);
      return;
    }
    if (this.memoryTimers.has(jobId)) return;
    const handle = setTimeout(() => {
      this.memoryTimers.delete(jobId);
      this.run(type, payload).catch((err) => this.logger.error(`timer ${type} failed: ${err}`));
    }, delay);
    this.memoryTimers.set(jobId, handle);
  }

  async cancel(type: string, dedupeKey: string): Promise<void> {
    const jobId = sanitize(`${type}__${dedupeKey}`);
    if (this.queue) {
      const job = await this.queue.getJob(jobId);
      if (job && (await job.isDelayed())) await job.remove();
      return;
    }
    const handle = this.memoryTimers.get(jobId);
    if (handle) clearTimeout(handle);
    this.memoryTimers.delete(jobId);
  }

  /** Backlog metric (delayed + waiting jobs). */
  async backlog(): Promise<number> {
    if (!this.queue) return this.memoryTimers.size;
    const counts = await this.queue.getJobCounts('delayed', 'waiting');
    return (counts.delayed ?? 0) + (counts.waiting ?? 0);
  }

  private async run(type: string, payload: any): Promise<void> {
    const handler = this.handlers.get(type);
    if (!handler) {
      this.logger.warn(`no handler for timer ${type}`);
      return;
    }
    await handler(payload);
  }
}

/** BullMQ custom ids may not contain ':'. */
const sanitize = (id: string) => id.replace(/:/g, '_');
