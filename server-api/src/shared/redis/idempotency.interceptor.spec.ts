/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { CallHandler, ExecutionContext, HttpException } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyStore } from './idempotency.store';

function makeContext(headers: Record<string, string>) {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  const req = { method: 'POST', headers, originalUrl: '/api/sn/shifts/1/accept', user: { id: 7 } };
  const ctx = { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as unknown as ExecutionContext;
  return { ctx, res };
}

describe('IdempotencyInterceptor', () => {
  it('requires the header', async () => {
    const interceptor = new IdempotencyInterceptor(new IdempotencyStore(null));
    const { ctx } = makeContext({});
    await expect(lastValueFrom(interceptor.intercept(ctx, { handle: () => of(null) }))).rejects.toBeInstanceOf(HttpException);
  });

  it('replays the stored response without calling the handler twice', async () => {
    const store = new IdempotencyStore(null);
    const interceptor = new IdempotencyInterceptor(store);
    let calls = 0;
    const first = makeContext({ 'idempotency-key': 'k1' });
    const handler: CallHandler = {
      handle: () => {
        calls += 1;
        first.res.status(201).json({ ok: calls });
        return of(undefined);
      },
    };
    await lastValueFrom(interceptor.intercept(first.ctx, handler), { defaultValue: undefined });
    // let the async persist settle
    await new Promise((r) => setImmediate(r));

    const second = makeContext({ 'idempotency-key': 'k1' });
    await lastValueFrom(interceptor.intercept(second.ctx, handler), { defaultValue: undefined });
    expect(calls).toBe(1);
    expect(second.res.statusCode).toBe(201);
    expect(second.res.body).toEqual({ ok: 1 });
    expect(second.res.headers['Idempotent-Replayed']).toBe('true');
  });

  it('rejects a concurrent duplicate', async () => {
    const store = new IdempotencyStore(null);
    await store.claim('idem:7:/api/sn/shifts/1/accept:k2', 60);
    const interceptor = new IdempotencyInterceptor(store);
    const { ctx } = makeContext({ 'idempotency-key': 'k2' });
    await expect(lastValueFrom(interceptor.intercept(ctx, { handle: () => of(null) }))).rejects.toMatchObject({ status: 409 });
  });
});
