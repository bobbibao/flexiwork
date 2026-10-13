<script lang="ts">
import SnWalletPage from "./Wallet";
export default SnWalletPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.wallet.title") }}</h1>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div class="sn-card" data-test="wallet-card">
      <div class="sn-muted">{{ $t("sn.wallet.balance") }}</div>
      <div class="font-size-h1 font-weight-bolder text-primary" data-test="wallet-balance">{{ formatVnd(wallet?.balance_vnd) }}</div>
      <div v-if="wallet?.escrow_held_vnd !== undefined" class="sn-muted">{{ $t("sn.wallet.escrowHeld") }}: {{ formatVnd(wallet.escrow_held_vnd) }}</div>
      <div v-if="wallet?.payout_pending_vnd" class="sn-muted">{{ $t("sn.wallet.payoutPending") }}: {{ formatVnd(wallet.payout_pending_vnd) }}</div>
    </div>

    <div class="sn-card">
      <h3 class="font-size-h6">{{ session.role === "employer" ? $t("sn.wallet.topUp") : $t("sn.wallet.payout") }}</h3>
      <p class="sn-muted">{{ session.role === "employer" ? $t("sn.wallet.topUpHint") : $t("sn.wallet.payoutHint") }}</p>
      <div v-if="session.role === 'employer'" class="mb-3">
        <button v-for="p in presets" :key="p" type="button" class="btn btn-light-primary mr-2 mb-2" :disabled="busy" :data-test="`topup-${p}`" @click="submit(p)">{{ formatVnd(p) }}</button>
      </div>
      <form class="d-flex" style="gap: 8px" @submit.prevent="submit()">
        <input v-model="amount" type="number" min="10000" step="1000" class="form-control" :placeholder="$t('sn.wallet.topUpCustom')" data-test="wallet-amount" />
        <button class="btn btn-primary text-nowrap" :disabled="busy || !amount" data-test="wallet-submit">{{ session.role === "employer" ? $t("sn.wallet.topUp") : $t("sn.wallet.payout") }}</button>
      </form>
      <p v-if="pending" class="text-warning mt-3 mb-0" data-test="intent-pending">{{ pending.kind === "topup" ? $t("sn.wallet.topUpPending") : $t("sn.wallet.payoutPendingMsg") }}</p>
    </div>

    <div class="sn-card">
      <h3 class="font-size-h6">{{ $t("sn.wallet.statement") }}</h3>
      <div v-if="!items.length" class="sn-empty">{{ $t("sn.wallet.noEntries") }}</div>
      <div v-for="i in items" :key="i.id" class="sn-row py-2 border-bottom" data-test="statement-item">
        <div>
          <div class="font-weight-bold">{{ $t(`sn.wallet.types.${i.type}`) }}</div>
          <div class="sn-muted">{{ formatDateTimeVn(i.created_at) }}</div>
        </div>
        <div class="text-right">
          <div :class="i.amount_vnd >= 0 ? 'text-success' : 'text-danger'" class="font-weight-bold">{{ i.amount_vnd >= 0 ? "+" : "" }}{{ formatVnd(i.amount_vnd) }}</div>
          <div class="sn-muted">{{ $t("sn.wallet.balanceAfter") }}: {{ formatVnd(i.balance_after_vnd) }}</div>
        </div>
      </div>
      <div v-if="pages > 1" class="sn-row mt-3">
        <button class="btn btn-light btn-sm" :disabled="page <= 1" @click="changePage(page - 1)">{{ $t("sn.common.previous") }}</button>
        <span class="sn-muted">{{ $t("sn.common.page", { page, pages }) }}</span>
        <button class="btn btn-light btn-sm" :disabled="page >= pages" @click="changePage(page + 1)">{{ $t("sn.common.next") }}</button>
      </div>
    </div>
  </div>
</template>
