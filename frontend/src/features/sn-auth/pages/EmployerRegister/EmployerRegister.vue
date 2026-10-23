<script lang="ts">
import SnEmployerRegisterPage from "./EmployerRegister";
export default SnEmployerRegisterPage;
</script>

<template>
  <form class="sn-form" data-test="sn-register-employer-form" novalidate @submit.prevent="submit">
    <h2 class="sn-page-title">{{ $t("sn.auth.employerTitle") }}</h2>
    <p class="sn-page-subtitle">{{ $t("sn.auth.employerSubtitle") }}</p>
    <SnAlert :message="error" />
    <div class="form-group">
      <label for="e-company">{{ $t("sn.auth.companyName") }}</label>
      <input id="e-company" v-model="form.company_name" class="form-control form-control-lg" autocomplete="organization" />
    </div>
    <div class="form-group">
      <label for="e-tax">{{ $t("sn.auth.taxCode") }} <span class="sn-muted">({{ $t("sn.common.optional") }})</span></label>
      <input id="e-tax" v-model="form.tax_code" class="form-control" inputmode="numeric" />
    </div>
    <div class="form-group">
      <label for="e-contact">{{ $t("sn.auth.contactName") }}</label>
      <input id="e-contact" v-model="form.contact_name" class="form-control" autocomplete="name" />
    </div>
    <div class="form-group">
      <label for="e-email">{{ $t("sn.common.email") }}</label>
      <input id="e-email" v-model="form.email" type="email" class="form-control" autocomplete="email" />
    </div>
    <div class="form-group">
      <label for="e-phone">{{ $t("sn.common.phone") }}</label>
      <input id="e-phone" v-model="form.phone" type="tel" class="form-control" autocomplete="tel" placeholder="028 3812 3456" />
    </div>
    <div class="form-group">
      <label for="e-address">{{ $t("sn.common.address") }} <span class="sn-muted">({{ $t("sn.common.optional") }})</span></label>
      <input id="e-address" v-model="form.address" class="form-control" autocomplete="street-address" />
    </div>
    <div class="form-group">
      <label for="e-pass">{{ $t("sn.common.password") }}</label>
      <input id="e-pass" v-model="form.password" type="password" class="form-control" autocomplete="new-password" />
      <small class="sn-muted">{{ $t("sn.auth.passwordHint") }}</small>
    </div>
    <label class="d-flex align-items-start mb-4">
      <input v-model="form.accept_terms" type="checkbox" class="mr-2 mt-1" data-test="e-terms" /> <span>{{ $t("sn.auth.acceptTerms") }}</span>
    </label>
    <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="busy || !form.accept_terms" data-test="e-submit">
      {{ busy ? $t("sn.common.loading") : $t("sn.auth.createAccount") }}
    </button>
    <div class="text-center mt-4 sn-muted">
      <div>{{ $t("sn.auth.haveAccount") }} <router-link to="/sn/login" class="font-weight-bold">{{ $t("sn.auth.loginButton") }}</router-link></div>
      <div class="mt-2"><router-link to="/sn/register/worker" class="text-primary font-weight-bold"><i class="la la-user mr-1"></i>{{ $t("sn.auth.registerWorker") }}</router-link></div>
    </div>
  </form>
</template>
