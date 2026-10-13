<script lang="ts">
import SnShiftCreatePage from "./ShiftCreate";
export default SnShiftCreatePage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.nav.postShift") }}</h1>
    <SnAlert :message="error" />
    <div v-if="!locations.length" class="sn-card sn-empty">
      <p>{{ $t("sn.profile.noLocations") }}</p>
      <router-link to="/sn/employer/locations" class="btn btn-primary">{{ $t("sn.profile.addLocation") }}</router-link>
    </div>
    <div v-else class="row">
      <form class="col-lg-7 sn-form" data-test="shift-create-form" @submit.prevent="submit">
        <div class="sn-card">
          <div class="form-group">
            <label for="sc-title">{{ $t("sn.shift.title") }}</label>
            <input id="sc-title" v-model="form.title" class="form-control" :placeholder="$t('sn.shift.titlePlaceholder')" required />
          </div>
          <div class="form-row">
            <div class="form-group col-sm-6">
              <label for="sc-skill">{{ $t("sn.shift.skill") }}</label>
              <select id="sc-skill" v-model="form.skill_code" class="form-control">
                <option v-for="s in skills" :key="s.code" :value="s.code">{{ s.name_vi }}</option>
              </select>
            </div>
            <div class="form-group col-sm-6">
              <label for="sc-location">{{ $t("sn.shift.location") }}</label>
              <select id="sc-location" v-model="form.work_location_id" class="form-control">
                <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-sm-6">
              <label for="sc-start">{{ $t("sn.shift.start") }}</label>
              <input id="sc-start" v-model="form.start" type="datetime-local" class="form-control" required />
            </div>
            <div class="form-group col-sm-6">
              <label for="sc-end">{{ $t("sn.shift.end") }}</label>
              <input id="sc-end" v-model="form.end" type="datetime-local" class="form-control" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-sm-6">
              <label for="sc-rate">{{ $t("sn.shift.hourlyRate") }}</label>
              <input id="sc-rate" v-model="form.hourly_vnd" type="number" min="20000" step="1000" class="form-control" required />
            </div>
            <div class="form-group col-sm-6">
              <label for="sc-headcount">{{ $t("sn.shift.headcount") }}</label>
              <input id="sc-headcount" v-model="form.headcount" type="number" min="1" max="20" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label for="sc-dispatch">{{ $t("sn.shift.dispatchMode") }}</label>
            <select id="sc-dispatch" v-model="form.dispatch_mode" class="form-control">
              <option value="">{{ $t("sn.shift.dispatchAuto") }}</option>
              <option value="sequential">{{ $t("sn.shift.dispatchSequential") }}</option>
              <option value="broadcast">{{ $t("sn.shift.dispatchBroadcast") }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="sc-desc">{{ $t("sn.shift.description") }} <span class="sn-muted">({{ $t("sn.common.optional") }})</span></label>
            <textarea id="sc-desc" v-model="form.description" class="form-control" rows="3" :placeholder="$t('sn.shift.descriptionPlaceholder')"></textarea>
          </div>
        </div>
        <button class="btn btn-primary btn-lg btn-block d-lg-none" :disabled="busy || !form.title" data-test="shift-submit-mobile">{{ busy ? $t("sn.common.loading") : $t("sn.shift.postButton") }}</button>
      </form>
      <div class="col-lg-5">
        <div class="sn-card" data-test="price-preview">
          <h3 class="font-size-h6">{{ $t("sn.shift.pricePreview") }}</h3>
          <template v-if="quote">
            <div class="sn-kv"><span>{{ $t("sn.shift.duration") }}</span><span>{{ minutesToHoursLabel(quote.scheduled_minutes) }}</span></div>
            <div class="sn-kv"><span>{{ $t("sn.shift.estimatedGross") }}</span><span data-test="quote-gross">{{ formatVnd(quote.estimated_gross_vnd) }}</span></div>
            <div class="sn-kv"><span>{{ $t("sn.shift.platformFee", { pct: quote.platform_fee_pct }) }}</span><span>{{ formatVnd(quote.platform_fee_vnd) }}</span></div>
            <div class="sn-kv font-size-h6"><span>{{ $t("sn.shift.escrowHold") }}</span><span class="sn-money" data-test="quote-hold">{{ formatVnd(quote.escrow_amount_vnd * Number(form.headcount || 1)) }}</span></div>
            <p class="sn-muted mt-2 mb-0">{{ $t("sn.shift.premiumNote") }}</p>
          </template>
          <p v-else class="sn-muted">{{ $t("sn.common.loading") }}</p>
          <button class="btn btn-primary btn-lg btn-block mt-4 d-none d-lg-block" :disabled="busy || !form.title" data-test="shift-submit" @click="submit">{{ busy ? $t("sn.common.loading") : $t("sn.shift.postButton") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
