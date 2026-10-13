<script lang="ts">
import SnMyShiftDetailPage from "./MyShiftDetail";
export default SnMyShiftDetailPage;
</script>

<template>
  <div>
    <router-link to="/sn/my-shifts" class="sn-muted"><i class="la la-arrow-left"></i> {{ $t("sn.common.back") }}</router-link>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-if="!shift" class="sn-empty">{{ $t("sn.common.loading") }}</div>
    <template v-else>
      <div class="sn-card mt-2" data-test="my-shift-detail">
        <div class="sn-row">
          <h1 class="sn-page-title">{{ shift.title }}</h1>
          <SnStatusBadge :status="shift.status" />
        </div>
        <div class="sn-muted mb-3">{{ shift.company_name }}</div>
        <div class="sn-kv"><span>{{ $t("sn.common.time") }}</span><span>{{ formatShiftRange(shift.start_at, shift.end_at) }}</span></div>
        <div class="sn-kv"><span>{{ $t("sn.shift.location") }}</span><span>{{ shift.location?.name || shift.location_name }}<br /><small class="sn-muted">{{ shift.location?.address || shift.address }}</small></span></div>
        <div class="sn-kv"><span>{{ $t("sn.shift.pay") }}</span><span class="sn-money">{{ formatVnd(shift.estimated_gross_vnd) }}</span></div>
        <div v-if="shift.checked_in_at" class="sn-kv"><span>{{ $t("sn.shift.checkedIn") }}</span><span>{{ formatDateTimeVn(shift.checked_in_at) }}</span></div>
        <div v-if="shift.checked_out_at" class="sn-kv"><span>{{ $t("sn.shift.checkedOut") }}</span><span>{{ formatDateTimeVn(shift.checked_out_at) }}</span></div>
        <template v-if="shift.net_vnd !== null">
          <div class="sn-kv"><span>{{ $t("sn.shift.gross") }}</span><span>{{ formatVnd(shift.gross_vnd) }}</span></div>
          <div class="sn-kv"><span>{{ $t("sn.shift.pit") }}</span><span>{{ formatVnd(shift.pit_vnd) }}</span></div>
          <div class="sn-kv font-size-h6"><span>{{ $t("sn.shift.net") }}</span><span class="sn-money" data-test="net-pay">{{ formatVnd(shift.net_vnd) }}</span></div>
        </template>
        <p v-if="shift.status === 'ACCEPTED'" class="text-warning mt-3 mb-0">{{ $t("sn.shift.awaitingEscrow") }}</p>
      </div>

      <div v-if="can('CheckIn') || can('CheckOut')" class="sn-card" data-test="attendance-card">
        <p class="sn-muted">{{ $t("sn.shift.checkInHint") }}</p>
        <p v-if="can('CheckIn') && opensAt" class="sn-muted">{{ $t("sn.shift.openNow", { time: formatTimeVn(opensAt) }) }}</p>
        <p v-if="distance !== null" class="font-weight-bold">{{ $t("sn.shift.distanceToLocation", { distance: formatDistance(distance) }) }}</p>
        <div v-if="can('CheckIn') && shift.location?.qr_required" class="form-group">
          <label for="qr-token">{{ $t("sn.shift.qrCode") }}</label>
          <div class="input-group">
            <input id="qr-token" v-model="qrToken" class="form-control" :placeholder="$t('sn.shift.qrCodePlaceholder')" data-test="qr-input" />
            <div v-if="canScan" class="input-group-append"><button type="button" class="btn btn-light" @click="scan">{{ $t("sn.shift.scanQr") }}</button></div>
          </div>
        </div>
        <button v-if="can('CheckIn')" class="btn btn-success btn-lg btn-block" :disabled="busy" data-test="btn-check-in" @click="attend('in')">{{ busy ? $t("sn.shift.locating") : $t("sn.shift.checkIn") }}</button>
        <button v-if="can('CheckOut')" class="btn btn-primary btn-lg btn-block" :disabled="busy" data-test="btn-check-out" @click="attend('out')">{{ busy ? $t("sn.shift.locating") : $t("sn.shift.checkOut") }}</button>
      </div>

      <div class="sn-actions">
        <button v-if="shift.status === 'PAID' && !shift.worker_rated" class="btn btn-warning" data-test="btn-rate-employer" @click="modal = 'rate'">{{ $t("sn.rating.rateEmployer") }}</button>
        <button v-if="can('WithdrawFromShift')" class="btn btn-light" data-test="btn-withdraw" @click="modal = 'withdraw'">{{ $t("sn.shift.withdraw") }}</button>
      </div>

      <div class="sn-card mt-3">
        <h3 class="font-size-h6">{{ $t("sn.shift.timeline") }}</h3>
        <SnTimeline :events="timeline" />
      </div>
    </template>

    <SnModal :show="modal === 'withdraw'" :title="$t('sn.shift.withdraw')" @close="modal = ''">
      <p>{{ $t("sn.shift.withdrawConfirm") }}</p>
      <button class="btn btn-danger btn-block" :disabled="busy" data-test="confirm-withdraw" @click="withdraw">{{ $t("sn.common.confirm") }}</button>
    </SnModal>
    <RatingDialog v-if="shift" :show="modal === 'rate'" :shift-id="shift.id" rater-role="worker" @close="modal = ''" @rated="load" />
  </div>
</template>
