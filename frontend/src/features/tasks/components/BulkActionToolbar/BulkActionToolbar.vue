<script lang="ts">
import BulkActionToolbar from "./BulkActionToolbar";
export default BulkActionToolbar;
</script>

<template>
  <div class="d-flex align-items-center gap-4 position-fixed toolbar" :class="{ show: tasks.length > 0 }">
    <span class="flex-grow">
      <span class="amount-selected">{{ tasks.length }}</span> {{ $t("msg.itemsSelected") }}
    </span>
    <div class="d-flex gap-3">
      <button v-b-modal="'Update-Bulk-Tasks'" class="btn-edit">{{ $t("button.editStatus") }}</button>
      <button v-b-modal="'Delete-Bulk-Tasks'" class="btn-delete">{{ $t("button.delete") }}</button>
      <button @click="handleCloseButton" class="btn-close">X</button>
    </div>
    <ConfirmModal
      :modal-id="'Delete-Bulk-Tasks'"
      :header="$t('title.deleteTask')"
      :body="$t('msg.delTasks')"
      @confirm="!!$event && deleteBulk()"
    />
    <ConfirmModal
      :modal-id="'Update-Bulk-Tasks'"
      :header="$t('task.updateTasksStatus')"
      :body="$t('msg.selectStatus')"
      @confirm="!!$event && updateBulk()"
    >
      <template #modal-body>
        <ButtonDropDown
          :listData="getStatusOption"
          :keyField="'id'"
          :displayField="'label'"
          :onChange="handleChangeStatus"
        >
          <template #title>
            <div class="label-dropdown" v-if="selectedStatus">
              <SeverityBadge :title="selectedStatus.label" :color="selectedStatus.color" />
            </div>
            <div class="label-dropdown" v-else>
              <span> Select</span>
            </div>
          </template>
          <template #option="{ data }">
            <SeverityBadge :title="data.label" :color="data.color" />
          </template>
        </ButtonDropDown>
      </template>
    </ConfirmModal>
  </div>
</template>

<style scoped>
@import "./BulkActionToolbar.scss";
</style>
