<script lang="ts">
import SnOffersPage from "./Offers";
export default SnOffersPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.shift.offersTitle") }}</h1>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-if="!items.length" class="sn-card sn-empty">{{ $t("sn.shift.noOffers") }}</div>
    <div v-for="s in items" :key="s.id" class="sn-card" data-test="offer-item">
      <div class="sn-row">
        <div class="font-weight-bold">{{ s.title }}</div>
        <span class="sn-money">{{ formatVnd(s.estimated_gross_vnd) }}</span>
      </div>
      <div class="sn-muted">{{ s.company_name }} · {{ s.location_name }}</div>
      <div class="sn-muted">{{ formatShiftRange(s.start_at, s.end_at) }} · {{ formatVnd(s.hourly_vnd) }}{{ $t("sn.common.perHour") }}</div>
      <div class="text-warning font-weight-bold mt-1">{{ $t("sn.shift.expiresIn", { minutes: minutesLeft(s) }) }}</div>
      <div class="sn-actions">
        <button class="btn btn-success flex-grow-1" :disabled="busy === s.id" data-test="accept-offer" @click="accept(s)">{{ $t("sn.shift.accept") }}</button>
        <button class="btn btn-light" :disabled="busy === s.id" data-test="decline-offer" @click="decline(s)">{{ $t("sn.shift.decline") }}</button>
        <router-link :to="`/sn/shifts/${s.id}`" class="btn btn-link">{{ $t("sn.common.details") }}</router-link>
      </div>
    </div>
  </div>
</template>
