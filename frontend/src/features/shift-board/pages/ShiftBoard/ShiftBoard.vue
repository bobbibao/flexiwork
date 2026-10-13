<script lang="ts">
import SnShiftBoardPage from "./ShiftBoard";
export default SnShiftBoardPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.shift.nearbyTitle") }}</h1>
    <SnAlert :message="info" variant="info" />
    <SnAlert :message="error" />
    <form class="sn-card sn-form" data-test="nearby-filters" @submit.prevent="search">
      <div class="form-row">
        <div class="form-group col-12 col-sm-5">
          <label for="nb-q">{{ $t("sn.shift.keyword") }}</label>
          <input id="nb-q" v-model="filters.q" class="form-control" :placeholder="$t('sn.shift.keywordPlaceholder')" />
        </div>
        <div class="form-group col-7 col-sm-4">
          <label for="nb-skill">{{ $t("sn.shift.skill") }}</label>
          <select id="nb-skill" v-model="filters.skill" class="form-control">
            <option value="">{{ $t("sn.shift.anySkill") }}</option>
            <option v-for="s in skills" :key="s.code" :value="s.code">{{ s.name_vi }}</option>
          </select>
        </div>
        <div class="form-group col-5 col-sm-3">
          <label for="nb-radius">{{ $t("sn.shift.radius") }} ({{ $t("sn.common.km") }})</label>
          <input id="nb-radius" v-model="filters.radius_km" type="number" min="1" max="50" class="form-control" />
        </div>
      </div>
      <div class="d-flex" style="gap: 8px">
        <button class="btn btn-primary" :disabled="!position" data-test="nearby-search">{{ $t("sn.common.search") }}</button>
        <button type="button" class="btn btn-light" @click="locate().then(search)"><i class="la la-crosshairs"></i> {{ $t("sn.common.useMyLocation") }}</button>
      </div>
    </form>
    <div v-if="loading" class="sn-empty">{{ $t("sn.common.loading") }}</div>
    <div v-else-if="position && !items.length" class="sn-card sn-empty">{{ $t("sn.shift.noNearby") }}</div>
    <router-link v-for="s in items" :key="s.id" :to="`/sn/shifts/${s.id}`" class="sn-card sn-list-item" data-test="nearby-item">
      <div class="sn-row">
        <div class="font-weight-bold">{{ s.title }}</div>
        <span class="sn-money">{{ formatVnd(s.estimated_gross_vnd) }}</span>
      </div>
      <div class="sn-muted">{{ s.company_name }} · {{ s.location_name }}</div>
      <div class="sn-row mt-1">
        <span class="sn-muted">{{ formatShiftRange(s.start_at, s.end_at) }}</span>
        <span class="label label-light-info label-inline">{{ formatDistance(s.distance_m) }}</span>
      </div>
      <div class="sn-muted">{{ skillName[s.skill_code] || s.skill_code }} · {{ formatVnd(s.hourly_vnd) }}{{ $t("sn.common.perHour") }}</div>
    </router-link>
  </div>
</template>
