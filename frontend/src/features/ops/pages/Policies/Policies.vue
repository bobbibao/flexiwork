<script lang="ts">
import SnOpsPoliciesPage from "./Policies";
export default SnOpsPoliciesPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.ops.policiesTitle") }}</h1>
    <p class="sn-page-subtitle">{{ $t("sn.ops.policiesSubtitle") }}</p>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-for="p in policies" :key="p.decision_point" class="sn-card" data-test="policy-item">
      <div class="sn-row">
        <div>
          <div class="font-weight-bold">{{ $te(`sn.ops.decisionPoints.${p.decision_point}`) ? $t(`sn.ops.decisionPoints.${p.decision_point}`) : p.decision_point }}</div>
          <div class="sn-muted">{{ p.description_vi }}</div>
          <div v-if="Object.keys(p.limits || {}).length" class="sn-muted">{{ $t("sn.ops.limits") }}: {{ JSON.stringify(p.limits) }}</div>
        </div>
        <div class="d-flex align-items-center" style="gap: 10px">
          <select :value="p.mode" class="form-control form-control-sm w-auto" :aria-label="$t('sn.ops.mode')" @change="update(p, { mode: $event.target.value })">
            <option v-for="m in ['manual', 'suggest', 'auto']" :key="m" :value="m">{{ $t(`sn.ops.modes.${m}`) }}</option>
          </select>
          <label class="m-0 d-flex align-items-center"><input type="checkbox" class="mr-1" :checked="p.enabled" @change="update(p, { enabled: $event.target.checked })" /> {{ $t("sn.ops.enabled") }}</label>
        </div>
      </div>
    </div>
  </div>
</template>
