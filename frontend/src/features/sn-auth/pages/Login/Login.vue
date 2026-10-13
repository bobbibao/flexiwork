<script lang="ts">
import SnLoginPage from "./Login";
export default SnLoginPage;
</script>

<template>
  <form class="sn-form" data-test="sn-login-form" novalidate @submit.prevent="submit()">
    <h2 class="sn-page-title">{{ $t("sn.auth.loginTitle") }}</h2>
    <p class="sn-page-subtitle">{{ $t("sn.auth.loginSubtitle") }}</p>
    <SnAlert :message="error" />
    <div class="form-group">
      <label for="sn-identifier">{{ $t("sn.auth.identifier") }}</label>
      <input id="sn-identifier" v-model="form.identifier" class="form-control form-control-lg" autocomplete="username" :placeholder="$t('sn.auth.identifierPlaceholder')" required />
    </div>
    <div class="form-group">
      <label for="sn-password">{{ $t("sn.common.password") }}</label>
      <input id="sn-password" v-model="form.password" type="password" class="form-control form-control-lg" autocomplete="current-password" required />
    </div>
    <div v-if="companies.length" class="mb-4">
      <p>{{ $t("sn.auth.chooseCompany") }}</p>
      <button v-for="c in companies" :key="c.id" type="button" class="btn btn-light-primary btn-block" @click="submit(c.id)">{{ c.name }}</button>
    </div>
    <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="busy || !form.identifier || !form.password" data-test="sn-login-submit">
      {{ busy ? $t("sn.common.loading") : $t("sn.auth.loginButton") }}
    </button>
    <div class="text-center mt-6 sn-muted">
      {{ $t("sn.auth.noAccount") }}
      <div class="mt-2 d-flex flex-column">
        <router-link to="/sn/register/worker" data-test="link-register-worker">{{ $t("sn.auth.registerWorker") }}</router-link>
        <router-link to="/sn/register/employer" data-test="link-register-employer">{{ $t("sn.auth.registerEmployer") }}</router-link>
      </div>
    </div>
  </form>
</template>
