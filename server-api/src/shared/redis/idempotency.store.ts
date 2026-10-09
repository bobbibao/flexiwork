import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

export interface IdempotencyRecord {
  state: 'in_progress' | 'done';
  status?: number;
  body?: unknown;
}

/** Storage for Idempotency-Key replays: Redis, or memory when REDIS_URL is empty. */
@Injectable()
export class IdempotencyStore {
  private readonly memory = new Map<string, { value: IdempotencyRecord; expiresAt: number }>();

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis | null) {}

  async get(key: string): Promise<IdempotencyRecord | null> {
    if (this.redis) {
      const raw = await this.redis.get(key);
      return raw ? JSON.parse(raw) : null;
    }
    const hit = this.memory.get(key);
    if (!hit || hit.expiresAt < Date.now()) return null;
    return hit.value;
  }

  async claim(key: string, ttlSeconds: number): Promise<boolean> {
    const value: IdempotencyRecord = { state: 'in_progress' };
    if (this.redis) {
      return (await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds, 'NX')) === 'OK';
    }
    if (await this.get(key)) return false;
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  async complete(key: string, status: number, body: unknown, ttlSeconds: number): Promise<void> {
    const value: IdempotencyRecord = { state: 'done', status, body };
    if (this.redis) {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async release(key: string): Promise<void> {
    if (this.redis) await this.redis.del(key);
    else this.memory.delete(key);
  }
}
