<script lang="ts">
import SnOpsDlqPage from "./Dlq";
export default SnOpsDlqPage;
</script>

<template>
  <div>
    <h1 class="sn-page-title">{{ $t("sn.ops.dlqTitle") }}</h1>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-if="!items.length" class="sn-card sn-empty">{{ $t("sn.ops.noDlq") }}</div>
    <div v-for="m in items" :key="m.id" class="sn-card" data-test="dlq-item">
      <div class="sn-row">
        <div>
          <div class="font-weight-bold">{{ $te(`sn.events.${m.envelope?.type}`) ? $t(`sn.events.${m.envelope?.type}`) : m.envelope?.type }}</div>
          <div class="sn-muted">{{ $t("sn.ops.consumerGroup") }}: {{ m.consumer_group }} · {{ formatDateTimeVn(m.created_at) }}</div>
        </div>
        <button class="btn btn-sm btn-primary" @click="replay(m.id)">{{ $t("sn.ops.replay") }}</button>
      </div>
      <pre class="bg-light p-2 rounded small mt-2 mb-0">{{ $t("sn.ops.error") }}: {{ m.error.split("\n")[0] }}</pre>
    </div>
  </div>
</template>
