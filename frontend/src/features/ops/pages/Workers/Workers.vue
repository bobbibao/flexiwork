<script lang="ts">
import SnOpsWorkersPage from "./Workers";
export default SnOpsWorkersPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.ops.workersTitle") }}</h1>
    <SnAlert :message="error" />
    <form class="sn-card d-flex flex-wrap align-items-center" style="gap: 10px" @submit.prevent="load">
      <input v-model="search" class="form-control w-auto flex-grow-1" :placeholder="$t('sn.common.search')" />
      <label class="m-0 d-flex align-items-center"><input v-model="onlyUnverified" type="checkbox" class="mr-1" @change="load" /> {{ $t("sn.ops.onlyUnverified") }}</label>
      <button class="btn btn-primary btn-sm">{{ $t("sn.common.search") }}</button>
    </form>
    <div v-for="w in items" :key="w.user_id" class="sn-card" data-test="ops-worker-item">
      <div class="sn-row">
        <div>
          <div class="font-weight-bold">{{ w.full_name }} <span class="sn-muted">#{{ w.user_id }}</span></div>
          <div class="sn-muted">{{ formatPhoneVn(w.phone_e164) }} · {{ $t("sn.profile.reliability") }} {{ w.reliability_score }} · {{ w.rating_avg ? `${w.rating_avg} ★` : "—" }} · {{ $t("sn.profile.completed") }} {{ w.completed_shifts }}</div>
        </div>
        <div class="d-flex" style="gap: 6px">
          <span v-if="w.verified" class="label label-light-success label-inline">{{ $t("sn.profile.verified") }}</span>
          <button v-else class="btn btn-sm btn-success" :data-test="`verify-${w.user_id}`" @click="verify(w.user_id)">{{ $t("sn.ops.verify") }}</button>
          <button v-if="!w.suspended" class="btn btn-sm btn-light-danger" @click="suspend(w.user_id)">{{ $t("sn.ops.suspend") }}</button>
          <button v-else class="btn btn-sm btn-light" @click="unsuspend(w.user_id)">{{ $t("sn.ops.unsuspend") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
