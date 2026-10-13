<script lang="ts">
import SnWorkerProfilePage from "./WorkerProfile";
export default SnWorkerProfilePage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.profile.workerTitle") }}</h1>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-if="profile" class="sn-card">
      <div class="sn-row mb-2">
        <div>
          <div class="font-weight-bold font-size-h5">{{ profile.full_name }}</div>
          <div class="sn-muted">{{ formatPhoneVn(profile.phone_e164) }}</div>
        </div>
        <span class="label label-inline" :class="profile.verified ? 'label-light-success' : 'label-light-warning'">{{ profile.verified ? $t("sn.profile.verified") : $t("sn.profile.notVerified").split(":")[0] }}</span>
      </div>
      <p v-if="!profile.verified" class="sn-muted">{{ $t("sn.profile.notVerified") }}</p>
      <div class="sn-kv"><span>{{ $t("sn.profile.reliability") }}</span><span data-test="reliability">{{ profile.reliability_score }}/100</span></div>
      <div class="sn-kv"><span>{{ $t("sn.profile.rating") }}</span><span>{{ profile.rating_avg ? `${profile.rating_avg} ★ · ${$t("sn.rating.count", { n: profile.rating_count })}` : "—" }}</span></div>
      <div class="sn-kv"><span>{{ $t("sn.profile.completed") }}</span><span>{{ profile.completed_shifts }}</span></div>
    </div>

    <form class="sn-card sn-form" data-test="worker-profile-form" @submit.prevent="save">
      <div class="form-group">
        <label for="wp-name">{{ $t("sn.auth.fullName") }}</label>
        <input id="wp-name" v-model="form.full_name" class="form-control" />
      </div>
      <div class="form-group">
        <label for="wp-dob">{{ $t("sn.profile.dob") }}</label>
        <input id="wp-dob" v-model="form.dob" type="date" class="form-control" />
      </div>
      <div class="form-group">
        <label>{{ $t("sn.profile.skills") }}</label>
        <div>
          <span v-for="s in skills" :key="s.code" class="sn-chip" :class="{ active: form.skill_codes.includes(s.code) }" role="checkbox" :aria-checked="form.skill_codes.includes(s.code)" :data-test="`skill-${s.code}`" @click="toggleSkill(s.code)">{{ s.name_vi }}</span>
        </div>
      </div>
      <h3 class="font-size-h6 mt-6">{{ $t("sn.profile.homeLocation") }}</h3>
      <div class="form-group">
        <label for="wp-address">{{ $t("sn.profile.homeAddress") }}</label>
        <input id="wp-address" v-model="form.home_address" class="form-control" />
      </div>
      <div class="form-row">
        <div class="form-group col-6">
          <label for="wp-lat">{{ $t("sn.common.latitude") }}</label>
          <input id="wp-lat" v-model="form.home_lat" type="number" step="0.000001" class="form-control" />
        </div>
        <div class="form-group col-6">
          <label for="wp-lng">{{ $t("sn.common.longitude") }}</label>
          <input id="wp-lng" v-model="form.home_lng" type="number" step="0.000001" class="form-control" />
        </div>
      </div>
      <button type="button" class="btn btn-light-primary btn-sm mb-4" @click="useMyLocation"><i class="la la-crosshairs"></i> {{ $t("sn.common.useMyLocation") }}</button>
      <div class="form-group">
        <label for="wp-radius">{{ $t("sn.profile.radiusKm") }}</label>
        <input id="wp-radius" v-model="form.radius_km" type="number" min="1" max="50" class="form-control" />
      </div>
      <h3 class="font-size-h6 mt-6">{{ $t("sn.profile.bank") }}</h3>
      <div class="form-group">
        <label for="wp-bank">{{ $t("sn.profile.bankName") }}</label>
        <input id="wp-bank" v-model="form.bank_name" class="form-control" placeholder="Vietcombank" />
      </div>
      <div class="form-group">
        <label for="wp-acc">{{ $t("sn.profile.accountNumber") }}</label>
        <input id="wp-acc" v-model="form.account_number" inputmode="numeric" class="form-control" />
      </div>
      <div class="form-group">
        <label for="wp-holder">{{ $t("sn.profile.accountHolder") }}</label>
        <input id="wp-holder" v-model="form.account_holder" class="form-control" />
      </div>
      <button class="btn btn-primary btn-block" :disabled="busy" data-test="save-profile">{{ busy ? $t("sn.common.saving") : $t("sn.common.save") }}</button>
    </form>
  </div>
</template>
