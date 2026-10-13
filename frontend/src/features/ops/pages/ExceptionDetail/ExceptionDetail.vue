<script lang="ts">
import SnOpsExceptionDetailPage from "./ExceptionDetail";
export default SnOpsExceptionDetailPage;
</script>

<template>
  <div>
    <router-link to="/sn/ops/exceptions" class="sn-muted"><i class="la la-arrow-left"></i> {{ $t("sn.common.back") }}</router-link>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />
    <div v-if="kase" class="row mt-2">
      <div class="col-lg-7">
        <div class="sn-card" data-test="exception-detail">
          <div class="sn-row">
            <h1 class="sn-page-title">{{ $te(`sn.ops.caseTypes.${kase.type}`) ? $t(`sn.ops.caseTypes.${kase.type}`) : kase.type }}</h1>
            <span class="label label-inline label-light-primary">{{ $t(`sn.ops.caseStatus.${kase.status}`) }}</span>
          </div>
          <p>{{ kase.summary }}</p>
          <div class="sn-kv"><span>{{ $t("sn.ops.severity") }}</span><span>{{ $t(`sn.ops.severities.${kase.severity}`) }}</span></div>
          <div class="sn-kv"><span>{{ $t("sn.ops.subject") }}</span><span>{{ $te(`sn.ops.subjectTypes.${kase.subject_type}`) ? $t(`sn.ops.subjectTypes.${kase.subject_type}`) : kase.subject_type }} · {{ kase.subject_id }}</span></div>
          <div class="sn-kv"><span>{{ $t("sn.ops.opened") }}</span><span>{{ formatDateTimeVn(kase.created_at) }}</span></div>
          <div class="sn-kv"><span>{{ $t("sn.ops.sla") }}</span><span>{{ formatDateTimeVn(kase.sla_due_at) }}</span></div>
          <h3 class="font-size-h6 mt-4">{{ $t("sn.ops.details") }}</h3>
          <div v-for="(v, k) in kase.details" :key="k" class="sn-kv"><span>{{ $te(`sn.ops.detailKeys.${k}`) ? $t(`sn.ops.detailKeys.${k}`) : k }}</span><span>{{ typeof v === "object" ? JSON.stringify(v) : String(k).endsWith("_vnd") ? formatVnd(v) : v }}</span></div>
          <div v-if="kase.resolution" class="mt-4">
            <h3 class="font-size-h6">{{ $t("sn.ops.resolution") }}</h3>
            <div class="sn-kv"><span>{{ $t("sn.ops.resolvedAction") }}</span><span>{{ (kase.suggested_actions || []).find(a => a.action === kase.resolution.action)?.label_vi || kase.resolution.action || $t("sn.ops.dismiss") }}</span></div>
            <div v-if="kase.resolution.note" class="sn-kv"><span>{{ $t("sn.common.note") }}</span><span>{{ kase.resolution.note }}</span></div>
            <div class="sn-kv"><span>{{ $t("sn.common.time") }}</span><span>{{ formatDateTimeVn(kase.resolution.at) }}</span></div>
          </div>
        </div>
        <div v-if="['OPEN', 'ACKNOWLEDGED'].includes(kase.status)" class="sn-card">
          <h3 class="font-size-h6">{{ $t("sn.ops.suggestedActions") }}</h3>
          <div class="form-group">
            <label for="ops-note">{{ $t("sn.common.note") }}</label>
            <textarea id="ops-note" v-model="note" class="form-control" rows="2"></textarea>
          </div>
          <div class="sn-actions">
            <button v-if="kase.status === 'OPEN'" class="btn btn-light-primary" :disabled="busy" data-test="ops-ack" @click="ack">{{ $t("sn.ops.acknowledge") }}</button>
            <button v-for="(a, i) in kase.suggested_actions" :key="i" class="btn btn-primary" :disabled="busy" :data-test="`ops-action-${i}`" @click="resolve(a)">{{ a.label_vi }}</button>
            <button class="btn btn-light" :disabled="busy" data-test="ops-dismiss" @click="dismiss">{{ $t("sn.ops.dismiss") }}</button>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div v-if="timeline.length" class="sn-card">
          <h3 class="font-size-h6">{{ $t("sn.shift.timeline") }}</h3>
          <SnTimeline :events="timeline" />
        </div>
        <div v-if="kase.decisions?.length" class="sn-card">
          <h3 class="font-size-h6">{{ $t("sn.ops.decisions") }}</h3>
          <div v-for="d in kase.decisions" :key="d.id" class="py-2 border-bottom">
            <div class="font-weight-bold">{{ $te(`sn.ops.decisionPoints.${d.decision_point}`) ? $t(`sn.ops.decisionPoints.${d.decision_point}`) : d.decision_point }}: {{ d.outcome }}</div>
            <div class="sn-muted">{{ $t(`sn.ops.modes.${d.mode}`) }} · {{ d.rationale }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
