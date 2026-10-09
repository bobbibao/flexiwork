export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface BankAccountRef {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface PaymentWebhookEvent {
  providerRef: string;
  kind: 'topup' | 'payout';
  status: 'succeeded' | 'failed';
  amountVnd: number;
  error?: string;
  raw: Record<string, unknown>;
}

/** Port over payment providers (Adapter; docs/ARCHITECTURE.md §8.7). Fake now; VNPay/MoMo/PayOS later. */
export interface PaymentGateway {
  readonly provider: string;
  createTopUp(input: { intentId: string; amountVnd: number; returnUrl: string }): Promise<{ providerRef: string; redirectUrl?: string; qrPayload?: string }>;
  createPayout(input: { intentId: string; amountVnd: number; bankAccount: BankAccountRef | null }): Promise<{ providerRef: string }>;
  /** Verifies the signature and parses the provider payload. Throws on an invalid signature. */
  parseWebhook(headers: Record<string, string | string[] | undefined>, rawBody: Buffer): Promise<PaymentWebhookEvent>;
}
