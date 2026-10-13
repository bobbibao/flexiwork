<script lang="ts">
import SnMyShiftsPage from "./MyShifts";
export default SnMyShiftsPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.shift.myShiftsTitle") }}</h1>
    <div class="sn-tabs" role="tablist">
      <button v-for="s in scopes" :key="s" type="button" role="tab" :class="{ active: scope === s }" :data-test="`scope-${s}`" @click="scope = s">{{ $t(`sn.tabs.${s}`) }}</button>
    </div>
    <SnAlert :message="error" />
    <div v-if="loading" class="sn-empty">{{ $t("sn.common.loading") }}</div>
    <div v-else-if="!items.length" class="sn-card sn-empty">{{ $t("sn.common.empty") }}</div>
    <router-link v-for="s in items" :key="s.id" :to="`/sn/my-shifts/${s.id}`" class="sn-card sn-list-item" data-test="my-shift-item">
      <div class="sn-row">
        <div class="font-weight-bold">{{ s.title }}</div>
        <SnStatusBadge :status="s.status" />
      </div>
      <div class="sn-muted">{{ s.company_name }} · {{ s.location_name }}</div>
      <div class="sn-row">
        <span class="sn-muted">{{ formatShiftRange(s.start_at, s.end_at) }}</span>
        <span class="sn-money">{{ formatVnd(s.net_vnd ?? s.estimated_gross_vnd) }}</span>
      </div>
    </router-link>
  </div>
</template>
