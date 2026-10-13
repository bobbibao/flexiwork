<script lang="ts">
import SnEmployerProfilePage from "./EmployerProfile";
export default SnEmployerProfilePage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.profile.employerTitle") }}</h1>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-if="info" class="sn-card">
      <div class="sn-kv"><span>{{ $t("sn.auth.companyName") }}</span><span>{{ info.company_name }}</span></div>
      <div class="sn-kv"><span>{{ $t("sn.common.phone") }}</span><span>{{ formatPhoneVn(info.phone_e164) }}</span></div>
      <div class="sn-kv"><span>{{ $t("sn.profile.rating") }}</span><span>{{ info.rating_avg ? `${info.rating_avg} ★ · ${$t("sn.rating.count", { n: info.rating_count })}` : "—" }}</span></div>
      <div class="sn-kv"><span>{{ $t("sn.profile.verified") }}</span><span>{{ info.verified ? $t("sn.common.yes") : $t("sn.common.no") }}</span></div>
    </div>
    <form class="sn-card sn-form" @submit.prevent="save">
      <div class="form-group">
        <label for="ep-legal">{{ $t("sn.profile.legalName") }}</label>
        <input id="ep-legal" v-model="form.legal_name" class="form-control" />
      </div>
      <div class="form-group">
        <label for="ep-tax">{{ $t("sn.auth.taxCode") }}</label>
        <input id="ep-tax" v-model="form.tax_code" class="form-control" />
      </div>
      <div class="form-group">
        <label for="ep-type">{{ $t("sn.profile.businessType") }}</label>
        <input id="ep-type" v-model="form.business_type" class="form-control" />
      </div>
      <div class="form-group">
        <label for="ep-address">{{ $t("sn.common.address") }}</label>
        <input id="ep-address" v-model="form.address" class="form-control" />
      </div>
      <button class="btn btn-primary" :disabled="busy">{{ busy ? $t("sn.common.saving") : $t("sn.common.save") }}</button>
    </form>
  </div>
</template>
