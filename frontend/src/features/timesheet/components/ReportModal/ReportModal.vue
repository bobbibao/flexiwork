<script lang="ts">
import ReportModal from "./ReportModal";
export default ReportModal;
</script>

<template>
  <b-modal
    :visible="visible"
    @change="$emit('update:visible', $event)"
    @hide="$emit('cancel')"
    hide-footer
    no-close-on-backdrop
    hide-header
    header-border-variant
    :title="modalTitle"
  >
    <div class="unlock-report-header">{{ modalTitle }}</div>

    <div class="row mx-0">
      <div class="col-md-6 pl-0">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.month") }}
        </div>
        <b-form-select
          v-model="reportMonth"
          :options="months"
          value-field="code"
          text-field="name"
          @change="setUnlockReportDate"
        ></b-form-select>
      </div>

      <div class="col-md-6 pr-0">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.year") }}
        </div>
        <b-form-select v-model="reportYear" :options="years" @change="setUnlockReportDate"></b-form-select>
      </div>
    </div>

    <div v-if="!isLockMode" class="col-md-12 p-0 mt-4">
      <div class="subtitle-1 font-weight-bolder mb-2">
        {{ $t("timesheet.users") }}
      </div>
      <b-form-select v-model="selected_users" :options="unlock_users" @change="setUnlockedUser"></b-form-select>
    </div>

    <div class="col-md-12 p-0 mt-4">
      <b-form-checkbox
        class="confirm-box"
        :checked="confirm_unlock === true"
        @change="confirm_unlock = !confirm_unlock"
        >{{ confirmText }}</b-form-checkbox
      >
    </div>

    <div class="col-md-12 p-0 mt-8 d-flex flex-row justify-content-between">
      <b-button variant="secondary" class="cancel-btn w-100 text-center mr-2 transparent-btn" @click="cancel">
        {{ $t("button.cancel") }}
      </b-button>
      <b-button variant="primary" class="save-btn w-100 text-center ml-2" style="float: right" @click="confirm">
        {{ $t("button.confirm") }}
      </b-button>
    </div>
  </b-modal>
</template>

<style lang="scss" scoped>
@import "./ReportModal.scss";
</style>
