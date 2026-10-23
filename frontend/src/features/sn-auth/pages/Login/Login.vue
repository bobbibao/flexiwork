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
    <div class="mt-6 pt-5 border-top">
      <div class="text-center font-weight-bold mb-3 text-dark-50">
        {{ $t("sn.auth.noAccount") }}
      </div>
      <div class="d-flex flex-column" style="gap: 10px;">
        <router-link to="/sn/register/worker" class="btn btn-outline-primary btn-block text-center font-weight-bold py-3" data-test="link-register-worker">
          <i class="la la-user mr-1"></i> {{ $t("sn.auth.registerWorker") }}
        </router-link>
        <router-link to="/sn/register/employer" class="btn btn-outline-secondary btn-block text-center font-weight-bold py-3" data-test="link-register-employer">
          <i class="la la-building mr-1"></i> {{ $t("sn.auth.registerEmployer") }}
        </router-link>
      </div>
    </div>
  </form>
</template>
