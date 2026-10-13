<script lang="ts">
import SnShiftPreviewPage from "./ShiftPreview";
export default SnShiftPreviewPage;
</script>

<template>
  <div>
    <a href="#" class="sn-muted" @click.prevent="$router.back()"><i class="la la-arrow-left"></i> {{ $t("sn.common.back") }}</a>
    <SnAlert :message="error" />
    <div v-if="shift" class="sn-card mt-2" data-test="shift-preview">
      <div class="sn-row">
        <h1 class="sn-page-title">{{ shift.title }}</h1>
        <SnStatusBadge :status="shift.status" />
      </div>
      <div class="sn-muted mb-3">{{ shift.company_name }}</div>
      <div class="sn-kv"><span>{{ $t("sn.common.time") }}</span><span>{{ formatShiftRange(shift.start_at, shift.end_at) }}</span></div>
      <div class="sn-kv"><span>{{ $t("sn.shift.location") }}</span><span>{{ shift.location?.name || shift.location_name }}<br /><small class="sn-muted">{{ shift.location?.address || shift.address }}</small></span></div>
      <div class="sn-kv"><span>{{ $t("sn.shift.skill") }}</span><span>{{ skills[shift.skill_code] || shift.skill_code }}</span></div>
      <div class="sn-kv"><span>{{ $t("sn.shift.hourlyRate") }}</span><span>{{ formatVnd(shift.hourly_vnd) }}</span></div>
      <div class="sn-kv"><span>{{ $t("sn.shift.pay") }}</span><span class="sn-money">{{ formatVnd(shift.estimated_gross_vnd) }}</span></div>
      <p v-if="shift.description" class="mt-3 mb-0">{{ shift.description }}</p>
      <div class="sn-actions">
        <button v-if="can('AcceptShift')" class="btn btn-success btn-lg flex-grow-1" :disabled="busy" data-test="preview-accept" @click="accept">{{ $t("sn.shift.accept") }}</button>
        <button v-if="can('DeclineOffer')" class="btn btn-light btn-lg" :disabled="busy" @click="decline">{{ $t("sn.shift.decline") }}</button>
      </div>
    </div>
  </div>
</template>
