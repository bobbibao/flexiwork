<script lang="ts">
import SnOpsExceptionsPage from "./Exceptions";
export default SnOpsExceptionsPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.ops.exceptionsTitle") }}</h1>
    <p class="sn-page-subtitle">{{ $t("sn.ops.exceptionsSubtitle") }}</p>
    <SnAlert :message="error" />
    <div class="sn-card d-flex flex-wrap" style="gap: 8px">
      <span v-for="(n, sev) in data.open_by_severity" :key="sev" class="label label-inline label-lg" :class="`label-light-${variant(sev)}`">{{ $t(`sn.ops.severities.${sev}`) }}: {{ n }}</span>
      <select v-model="filters.status" class="form-control form-control-sm w-auto ml-auto" @change="load">
        <option value="OPEN,ACKNOWLEDGED">{{ $t("sn.ops.caseStatus.OPEN") }} / {{ $t("sn.ops.caseStatus.ACKNOWLEDGED") }}</option>
        <option value="RESOLVED,DISMISSED">{{ $t("sn.ops.caseStatus.RESOLVED") }} / {{ $t("sn.ops.caseStatus.DISMISSED") }}</option>
      </select>
      <select v-model="filters.severity" class="form-control form-control-sm w-auto" @change="load">
        <option value="">{{ $t("sn.common.all") }}</option>
        <option v-for="s in ['critical', 'high', 'medium', 'low']" :key="s" :value="s">{{ $t(`sn.ops.severities.${s}`) }}</option>
      </select>
    </div>
    <div v-if="!data.items.length" class="sn-card sn-empty">{{ $t("sn.ops.noExceptions") }}</div>
    <router-link v-for="c in data.items" :key="c.id" :to="`/sn/ops/exceptions/${c.id}`" class="sn-card sn-list-item" data-test="exception-item">
      <div class="sn-row">
        <span class="font-weight-bold">{{ $te(`sn.ops.caseTypes.${c.type}`) ? $t(`sn.ops.caseTypes.${c.type}`) : c.type }}</span>
        <span>
          <span class="label label-inline mr-1" :class="`label-light-${variant(c.severity)}`">{{ $t(`sn.ops.severities.${c.severity}`) }}</span>
          <span class="label label-inline label-light">{{ $t(`sn.ops.caseStatus.${c.status}`) }}</span>
        </span>
      </div>
      <div>{{ c.summary }}</div>
      <div class="sn-muted">
        {{ $t("sn.ops.opened") }}: {{ formatDateTimeVn(c.created_at) }} · {{ $t("sn.ops.sla") }}: {{ formatDateTimeVn(c.sla_due_at) }}
        <span v-if="c.sla_breached" class="text-danger font-weight-bold">· {{ $t("sn.ops.slaBreached") }}</span>
      </div>
    </router-link>
  </div>
</template>
