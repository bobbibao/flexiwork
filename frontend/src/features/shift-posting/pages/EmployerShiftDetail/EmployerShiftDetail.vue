<script lang="ts">
import SnEmployerShiftDetailPage from "./EmployerShiftDetail";
export default SnEmployerShiftDetailPage;
</script>

<template>
  <div>
    <router-link to="/sn/employer/shifts" class="sn-muted"><i class="la la-arrow-left"></i> {{ $t("sn.common.back") }}</router-link>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-if="!shift" class="sn-empty">{{ $t("sn.common.loading") }}</div>
    <div v-else class="row mt-2">
      <div class="col-lg-7">
        <div class="sn-card" data-test="shift-detail">
          <div class="sn-row">
            <h1 class="sn-page-title">{{ shift.title }}</h1>
            <SnStatusBadge :status="shift.status" />
          </div>
          <div class="sn-muted mb-3">{{ formatShiftRange(shift.start_at, shift.end_at) }} · {{ shift.location_name }}</div>
          <div class="sn-kv"><span>{{ $t("sn.shift.skill") }}</span><span>{{ skills[shift.skill_code] || shift.skill_code }}</span></div>
          <div class="sn-kv"><span>{{ $t("sn.shift.hourlyRate") }}</span><span>{{ formatVnd(shift.hourly_vnd) }}</span></div>
          <div class="sn-kv"><span>{{ $t("sn.shift.estimatedGross") }}</span><span>{{ formatVnd(shift.estimated_gross_vnd) }}</span></div>
          <div class="sn-kv"><span>{{ $t("sn.shift.escrow") }}</span><span data-test="escrow-status">{{ formatVnd(shift.escrow_amount_vnd) }} · {{ $t(`sn.shift.escrow${shift.escrow_status === "held" ? "Held" : shift.escrow_status === "released" ? "Released" : shift.escrow_status === "refunded" ? "Refunded" : "None"}`) }}</span></div>
          <div v-if="shift.status === 'MATCHED'" class="sn-kv"><span>{{ $t("sn.shift.offeredTo", { count: shift.offered_worker_ids.length }) }}</span><span>{{ $t("sn.shift.offerExpires", { time: formatDateTimeVn(shift.offer_expires_at) }) }}</span></div>
          <div v-if="shift.checked_in_at" class="sn-kv"><span>{{ $t("sn.shift.checkedIn") }}</span><span>{{ formatDateTimeVn(shift.checked_in_at) }}</span></div>
          <div v-if="shift.checked_out_at" class="sn-kv"><span>{{ $t("sn.shift.checkedOut") }}</span><span>{{ formatDateTimeVn(shift.checked_out_at) }}</span></div>
          <div v-if="shift.worked_minutes !== null" class="sn-kv"><span>{{ $t("sn.shift.workedTime") }}</span><span>{{ minutesToHoursLabel(shift.worked_minutes) }}</span></div>
          <div v-if="shift.approved_minutes !== null" class="sn-kv"><span>{{ $t("sn.shift.approvedTime") }}</span><span>{{ minutesToHoursLabel(shift.approved_minutes) }}</span></div>
          <template v-if="shift.gross_vnd !== null">
            <div class="sn-kv"><span>{{ $t("sn.shift.gross") }}</span><span>{{ formatVnd(shift.gross_vnd) }}</span></div>
            <div class="sn-kv"><span>{{ $t("sn.shift.fee") }}</span><span>{{ formatVnd(shift.fee_vnd) }}</span></div>
          </template>
          <div v-if="shift.refund_vnd" class="sn-kv"><span>{{ $t("sn.shift.refund") }}</span><span data-test="refund">{{ formatVnd(shift.refund_vnd) }}</span></div>
          <div v-if="shift.cancel_reason" class="sn-kv"><span>{{ $t("sn.common.reason") }}</span><span>{{ $t(`sn.shift.cancelReasons.${shift.cancel_reason}`) }}</span></div>

          <div class="sn-actions">
            <button v-if="can('ConfirmCompletion')" class="btn btn-success" data-test="btn-confirm" @click="openConfirm">{{ $t("sn.shift.confirmCompletion") }}</button>
            <button v-if="can('DisputeCompletion')" class="btn btn-light-danger" data-test="btn-dispute" @click="modal = 'dispute'">{{ $t("sn.shift.dispute") }}</button>
            <button v-if="can('DirectOffer')" class="btn btn-light-primary" data-test="btn-direct-offer" @click="modal = 'offer'">{{ $t("sn.shift.directOffer") }}</button>
            <button v-if="shift.status === 'PAID' && !shift.employer_rated" class="btn btn-warning" data-test="btn-rate" @click="modal = 'rate'">{{ $t("sn.shift.rate") }}</button>
            <button v-if="['ESCROW_FUNDED', 'ACCEPTED'].includes(shift.status) && shift.location?.qr_required" class="btn btn-light" @click="modal = 'qr'">{{ $t("sn.shift.showQr") }}</button>
            <button v-if="can('CancelShift')" class="btn btn-light" data-test="btn-cancel" @click="modal = 'cancel'">{{ $t("sn.shift.cancelShift") }}</button>
          </div>
        </div>
        <div v-if="worker" class="sn-card" data-test="worker-card">
          <h3 class="font-size-h6">{{ $t("sn.shift.worker") }}</h3>
          <div class="font-weight-bold">{{ worker.full_name }}</div>
          <div class="sn-muted">{{ formatPhoneVn(worker.phone_e164) }}</div>
          <div class="sn-muted">{{ $t("sn.profile.reliability") }}: {{ worker.reliability_score }}/100 · {{ worker.rating_avg ? `${worker.rating_avg} ★` : "—" }} · {{ $t("sn.profile.completed") }}: {{ worker.completed_shifts }}</div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="sn-card">
          <h3 class="font-size-h6">{{ $t("sn.shift.timeline") }}</h3>
          <SnTimeline :events="timeline" />
        </div>
      </div>
    </div>

    <SnModal :show="modal === 'cancel'" :title="$t('sn.shift.cancelShift')" @close="modal = ''">
      <p>{{ $t("sn.shift.cancelConfirm", { hours: freeCancelHours, pct: lateCompPct }) }}</p>
      <button class="btn btn-danger btn-block" :disabled="busy" data-test="confirm-cancel" @click="doCancel">{{ $t("sn.common.confirm") }}</button>
    </SnModal>
    <SnModal :show="modal === 'offer'" :title="$t('sn.shift.directOffer')" @close="modal = ''">
      <p class="sn-muted">{{ $t("sn.shift.directOfferHint") }}</p>
      <input v-model="offerPhone" type="tel" class="form-control mb-3" placeholder="0901 234 567" data-test="offer-phone" />
      <button class="btn btn-primary btn-block" :disabled="busy || !offerPhone" data-test="send-offer" @click="doOffer">{{ $t("sn.shift.sendOffer") }}</button>
    </SnModal>
    <SnModal :show="modal === 'confirm'" :title="$t('sn.shift.confirmCompletion')" @close="modal = ''">
      <div class="form-group">
        <label for="approved">{{ $t("sn.shift.approvedMinutes") }}</label>
        <input id="approved" v-model="approved" type="number" min="0" :max="scheduled" class="form-control" data-test="approved-minutes" />
        <small class="sn-muted">{{ $t("sn.shift.approvedMinutesHint", { max: scheduled }) }}</small>
      </div>
      <button class="btn btn-success btn-block" :disabled="busy" data-test="confirm-completion" @click="doConfirm">{{ $t("sn.common.confirm") }}</button>
    </SnModal>
    <SnModal :show="modal === 'dispute'" :title="$t('sn.shift.dispute')" @close="modal = ''">
      <div class="form-group">
        <label for="d-reason">{{ $t("sn.shift.disputeReason") }}</label>
        <select id="d-reason" v-model="dispute.reason_code" class="form-control">
          <option v-for="r in reasons" :key="r" :value="r">{{ $t(`sn.shift.reasonCodes.${r}`) }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="d-minutes">{{ $t("sn.shift.claimedMinutes") }}</label>
        <input id="d-minutes" v-model="dispute.claimed_minutes" type="number" min="0" :max="scheduled" class="form-control" data-test="claimed-minutes" />
      </div>
      <div class="form-group">
        <label for="d-note">{{ $t("sn.shift.disputeNote") }}</label>
        <textarea id="d-note" v-model="dispute.note" class="form-control" rows="3"></textarea>
      </div>
      <button class="btn btn-danger btn-block" :disabled="busy" data-test="send-dispute" @click="doDispute">{{ $t("sn.common.send") }}</button>
    </SnModal>
    <SnModal :show="modal === 'qr'" :title="$t('sn.shift.showQr')" @close="modal = ''">
      <LocationQr v-if="shift && modal === 'qr'" :location-id="shift.work_location_id" />
    </SnModal>
    <RatingDialog v-if="shift" :show="modal === 'rate'" :shift-id="shift.id" rater-role="employer" @close="modal = ''" @rated="load" />
  </div>
</template>
