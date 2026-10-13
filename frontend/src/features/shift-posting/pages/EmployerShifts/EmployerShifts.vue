<script lang="ts">
import SnEmployerShiftsPage from "./EmployerShifts";
export default SnEmployerShiftsPage;
</script>

<template>
  <div>
    <div class="sn-row mb-3">
      <h1 class="sn-page-title">{{ $t("sn.nav.employerShifts") }}</h1>
      <div class="d-flex" style="gap: 6px">
        <button class="btn btn-light btn-sm" @click="reload">{{ $t("sn.common.refresh") }}</button>
        <router-link to="/sn/employer/shifts/new" class="btn btn-primary btn-sm" data-test="post-shift">{{ $t("sn.nav.postShift") }}</router-link>
      </div>
    </div>
    <div class="sn-tabs" role="tablist">
      <button v-for="t in tabs" :key="t" type="button" role="tab" :class="{ active: tab === t }" :aria-selected="tab === t" :data-test="`tab-${t}`" @click="tab = t">
        {{ $t(`sn.tabs.${t}`) }} <span v-if="counts[t]" class="badge badge-pill badge-light">{{ counts[t] }}</span>
      </button>
    </div>
    <SnAlert :message="error" />
    <div v-if="loading" class="sn-empty">{{ $t("sn.common.loading") }}</div>
    <div v-else-if="!items.length" class="sn-card sn-empty">
      <p>{{ $t("sn.shift.noShifts") }}</p>
      <router-link v-if="tab === 'open'" to="/sn/employer/shifts/new" class="btn btn-primary">{{ $t("sn.shift.postFirst") }}</router-link>
    </div>
    <router-link v-for="s in items" :key="s.id" :to="`/sn/employer/shifts/${s.id}`" class="sn-card sn-list-item" data-test="employer-shift-item">
      <div class="sn-row">
        <div class="font-weight-bold">{{ s.title }}</div>
        <SnStatusBadge :status="s.status" />
      </div>
      <div class="sn-muted">{{ formatShiftRange(s.start_at, s.end_at) }} · {{ s.location_name }}</div>
      <div class="sn-row mt-2">
        <span class="sn-muted">{{ skills[s.skill_code] || s.skill_code }} · {{ formatVnd(s.hourly_vnd) }}{{ $t("sn.common.perHour") }}</span>
        <span class="sn-money">{{ formatVnd(s.gross_vnd ?? s.estimated_gross_vnd) }}</span>
      </div>
    </router-link>
    <div v-if="pages > 1" class="sn-row mt-3">
      <button class="btn btn-light btn-sm" :disabled="page <= 1" @click="page--">{{ $t("sn.common.previous") }}</button>
      <span class="sn-muted">{{ $t("sn.common.page", { page, pages }) }}</span>
      <button class="btn btn-light btn-sm" :disabled="page >= pages" @click="page++">{{ $t("sn.common.next") }}</button>
    </div>
  </div>
</template>
