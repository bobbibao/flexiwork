import { snApi, newIdempotencyKey } from "@/api/sn-api";
import { SN_WALLET } from "@/api/sn-endpoints";

export interface WalletDto {
  account_code: string;
  balance_vnd: number;
  escrow_held_vnd?: number;
  payout_pending_vnd?: number;
}

export interface StatementItem {
  id: number;
  type: string;
  amount_vnd: number;
  balance_after_vnd: number;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface IntentDto {
  id: string;
  kind: "topup" | "payout";
  amount_vnd: number;
  status: string;
}

export class WalletService {
  get() {
    return snApi.get<WalletDto>(SN_WALLET.ME);
  }
  statement(page = 1) {
    return snApi.get<{ items: StatementItem[]; total_pages: number; page: number }>(SN_WALLET.STATEMENT, { page, page_size: 20 });
  }
  topUp(amountVnd: number) {
    return snApi.post<IntentDto>(SN_WALLET.TOP_UPS, { amount_vnd: amountVnd }, newIdempotencyKey());
  }
  payout(amountVnd: number) {
    return snApi.post<IntentDto>(SN_WALLET.PAYOUTS, { amount_vnd: amountVnd }, newIdempotencyKey());
  }
  intent(id: string) {
    return snApi.get<IntentDto>(SN_WALLET.INTENT(id));
  }
}

export const walletService = new WalletService();
