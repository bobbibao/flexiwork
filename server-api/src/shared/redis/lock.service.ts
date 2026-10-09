import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type Redis from 'ioredis';

const RELEASE_SCRIPT = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

/** Distributed lock: SET NX PX + token-checked release (docs/ARCHITECTURE.md §12). */
@Injectable()
export class LockService {
  private readonly memory = new Map<string, { token: string; expiresAt: number }>();

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis | null) {}

  async acquire(key: string, ttlMs: number): Promise<string | null> {
    const token = randomUUID();
    if (this.redis) {
      const ok = await this.redis.set(key, token, 'PX', ttlMs, 'NX');
      return ok === 'OK' ? token : null;
    }
    const now = Date.now();
    const held = this.memory.get(key);
    if (held && held.expiresAt > now) return null;
    this.memory.set(key, { token, expiresAt: now + ttlMs });
    return token;
  }

  async release(key: string, token: string): Promise<void> {
    if (this.redis) {
      await this.redis.eval(RELEASE_SCRIPT, 1, key, token);
      return;
    }
    if (this.memory.get(key)?.token === token) this.memory.delete(key);
  }

  /** Runs fn while holding the lock; returns null without running fn if the lock is taken. */
  async withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<{ acquired: boolean; result?: T }> {
    const token = await this.acquire(key, ttlMs);
    if (!token) return { acquired: false };
    try {
      return { acquired: true, result: await fn() };
    } finally {
      await this.release(key, token);
    }
  }
}
