/** Ledger accounts (docs/ARCHITECTURE.md §8.2). Pure domain: no framework imports. */
export type AccountType =
  | 'employer_wallet'
  | 'worker_wallet'
  | 'escrow'
  | 'payout_pending'
  | 'platform_revenue'
  | 'tax_payable'
  | 'gateway_clearing';

export interface AccountRef {
  code: string;
  type: AccountType;
  ownerType: string | null;
  ownerId: string | null;
}

export const Accounts = {
  employer: (companyId: number): AccountRef => ({ code: `employer:${companyId}`, type: 'employer_wallet', ownerType: 'company', ownerId: String(companyId) }),
  worker: (userId: number): AccountRef => ({ code: `worker:${userId}`, type: 'worker_wallet', ownerType: 'worker', ownerId: String(userId) }),
  escrow: (shiftId: string): AccountRef => ({ code: `escrow:shift:${shiftId}`, type: 'escrow', ownerType: 'shift', ownerId: shiftId }),
  payoutPending: (userId: number): AccountRef => ({ code: `payout_pending:${userId}`, type: 'payout_pending', ownerType: 'worker', ownerId: String(userId) }),
  feeRevenue: (): AccountRef => ({ code: 'platform:fee_revenue', type: 'platform_revenue', ownerType: 'platform', ownerId: null }),
  pitPayable: (): AccountRef => ({ code: 'platform:pit_payable', type: 'tax_payable', ownerType: 'platform', ownerId: null }),
  clearing: (provider: string): AccountRef => ({ code: `gateway:${provider}:clearing`, type: 'gateway_clearing', ownerType: 'platform', ownerId: provider }),
};

/** Only the clearing account may go negative (it mirrors money held at the provider). */
export const mayGoNegative = (type: AccountType) => type === 'gateway_clearing';
