import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { BankAccountRef, PaymentGateway, PaymentWebhookEvent } from '../application/ports/payment-gateway.port';
import { snConfig } from 'src/shared/sn-runtime';

const SIGNATURE_HEADER = 'x-fake-signature';

/**
 * Deterministic fake provider (docs/ARCHITECTURE.md §8.7):
 * after FAKE_GATEWAY_DELAY_MS it POSTs an HMAC-signed webhook to this API.
 * Amounts ending in 13 (e.g. 100013) fail: a test hook for failure branches.
 */
@Injectable()
export class FakePaymentGateway implements PaymentGateway {
  readonly provider = 'fake';
  private readonly logger = new Logger(FakePaymentGateway.name);

  async createTopUp(input: { intentId: string; amountVnd: number; returnUrl: string }) {
    const providerRef = `fake_top_${randomUUID()}`;
    this.scheduleWebhook({ provider_ref: providerRef, kind: 'topup', amount_vnd: input.amountVnd });
    return { providerRef, qrPayload: `FAKEPAY|${providerRef}|${input.amountVnd}` };
  }

  async createPayout(input: { intentId: string; amountVnd: number; bankAccount: BankAccountRef | null }) {
    const providerRef = `fake_out_${randomUUID()}`;
    this.scheduleWebhook({ provider_ref: providerRef, kind: 'payout', amount_vnd: input.amountVnd });
    return { providerRef };
  }

  async parseWebhook(headers: Record<string, string | string[] | undefined>, rawBody: Buffer): Promise<PaymentWebhookEvent> {
    const given = String(headers[SIGNATURE_HEADER] ?? '');
    const expected = this.sign(rawBody.toString('utf8'));
    if (!given || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
      throw new Error('Invalid webhook signature');
    }
    const body = JSON.parse(rawBody.toString('utf8'));
    return {
      providerRef: body.provider_ref,
      kind: body.kind,
      status: body.status,
      amountVnd: Number(body.amount_vnd),
      error: body.error,
      raw: body,
    };
  }

  private sign(payload: string): string {
    return createHmac('sha256', snConfig().FAKE_GATEWAY_WEBHOOK_SECRET || 'fake-dev-secret').update(payload).digest('hex');
  }

  private scheduleWebhook(body: { provider_ref: string; kind: 'topup' | 'payout'; amount_vnd: number }) {
    const failed = String(body.amount_vnd).endsWith('13');
    const payload = JSON.stringify({ ...body, status: failed ? 'failed' : 'succeeded', ...(failed && { error: 'FAKE_DECLINED' }) });
    const port = process.env.PORT || '7001';
    setTimeout(() => {
      fetch(`http://127.0.0.1:${port}/api/sn/payments/webhooks/fake`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [SIGNATURE_HEADER]: this.sign(payload) },
        body: payload,
      }).catch((err) => this.logger.error(`fake webhook delivery failed: ${err}`));
    }, snConfig().FAKE_GATEWAY_DELAY_MS);
  }
}
