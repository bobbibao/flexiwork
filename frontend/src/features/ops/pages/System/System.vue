<script lang="ts">
import SnOpsSystemPage from "./System";
export default SnOpsSystemPage;
</script>

<template>
  <div>
    <div class="sn-row mb-3">
      <h1 class="sn-page-title">{{ $t("sn.ops.systemTitle") }}</h1>
      <button class="btn btn-light btn-sm" @click="load">{{ $t("sn.common.refresh") }}</button>
    </div>
    <SnAlert :message="error" />
    <div class="sn-card">
      <div class="sn-row">
        <h3 class="font-size-h6 m-0">{{ $t("sn.ops.reconcile") }}</h3>
        <button class="btn btn-primary btn-sm" :disabled="busy" data-test="run-recon" @click="reconcile">{{ $t("sn.ops.reconcile") }}</button>
      </div>
      <p v-if="recon" class="mt-3 mb-0" :class="recon.ok ? 'text-success' : 'text-danger'" data-test="recon-result">
        {{ recon.ok ? $t("sn.ops.reconcileOk") : $t("sn.ops.reconcileBad") }} · {{ $t("sn.ops.lastRun") }}: {{ formatDateTimeVn(recon.ran_at) }}
      </p>
    </div>
    <div v-if="health" class="sn-card">
      <h3 class="font-size-h6">{{ $t("sn.ops.dependencies") }}</h3>
      <div v-for="k in ['postgres', 'redis', 'elasticsearch']" :key="k" class="sn-kv">
        <span>{{ $t(`sn.ops.depNames.${k}`) }}</span>
        <span :class="health[k].ok ? 'text-success' : 'text-danger'">{{ health[k].ok ? $t("sn.ops.healthy") : $t("sn.ops.unhealthy") }}{{ health[k].mode ? ` · ${health[k].mode}` : "" }}</span>
      </div>
      <div class="sn-kv"><span>{{ $t("sn.ops.depNames.broker") }}</span><span>{{ health.broker.driver }} · {{ health.broker.consumer_groups.length }}</span></div>
      <h3 class="font-size-h6 mt-4">{{ $t("sn.ops.metrics") }}</h3>
      <div v-for="(v, k) in health.metrics" :key="k" class="sn-kv"><span>{{ $te(`sn.ops.metricNames.${k}`) ? $t(`sn.ops.metricNames.${k}`) : k }}</span><span>{{ v }}</span></div>
    </div>
  </div>
</template>
