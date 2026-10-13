<script lang="ts">
import SnWorkerRegisterPage from "./WorkerRegister";
export default SnWorkerRegisterPage;
</script>

<template>
  <form class="sn-form" data-test="sn-register-worker-form" novalidate @submit.prevent="submit">
    <h2 class="sn-page-title">{{ $t("sn.auth.workerTitle") }}</h2>
    <p class="sn-page-subtitle">{{ $t("sn.auth.workerSubtitle") }}</p>
    <SnAlert :message="error" />
    <div class="form-group">
      <label for="w-name">{{ $t("sn.auth.fullName") }}</label>
      <input id="w-name" v-model="form.full_name" class="form-control form-control-lg" autocomplete="name" :placeholder="$t('sn.auth.fullNamePlaceholder')" />
    </div>
    <div class="form-group">
      <label for="w-phone">{{ $t("sn.common.phone") }}</label>
      <input id="w-phone" v-model="form.phone" type="tel" inputmode="tel" class="form-control form-control-lg" autocomplete="tel" placeholder="0901 234 567" />
    </div>
    <div class="form-group">
      <label for="w-email">{{ $t("sn.common.email") }} <span class="sn-muted">({{ $t("sn.common.optional") }})</span></label>
      <input id="w-email" v-model="form.email" type="email" class="form-control form-control-lg" autocomplete="email" />
    </div>
    <div class="form-group">
      <label for="w-pass">{{ $t("sn.common.password") }}</label>
      <input id="w-pass" v-model="form.password" type="password" class="form-control form-control-lg" autocomplete="new-password" />
      <small class="sn-muted">{{ $t("sn.auth.passwordHint") }}</small>
    </div>
    <label class="d-flex align-items-start mb-3">
      <input v-model="form.adult" type="checkbox" class="mr-2 mt-1" data-test="w-adult" /> <span>{{ $t("sn.auth.adultConfirm") }}</span>
    </label>
    <label class="d-flex align-items-start mb-4">
      <input v-model="form.accept_terms" type="checkbox" class="mr-2 mt-1" data-test="w-terms" /> <span>{{ $t("sn.auth.acceptTerms") }}</span>
    </label>
    <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="busy || !form.accept_terms || !form.adult" data-test="w-submit">
      {{ busy ? $t("sn.common.loading") : $t("sn.auth.createAccount") }}
    </button>
    <div class="text-center mt-4 sn-muted">
      {{ $t("sn.auth.haveAccount") }} <router-link to="/sn/login">{{ $t("sn.auth.loginButton") }}</router-link>
    </div>
  </form>
</template>
