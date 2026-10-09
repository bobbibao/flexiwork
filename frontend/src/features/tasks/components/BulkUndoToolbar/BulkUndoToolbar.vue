<script lang="ts">
import BulkUndoToolbar from "./BulkUndoToolbar";
export default BulkUndoToolbar;
</script>

<template>
  <div class="d-flex align-items-center gap-4 position-fixed toolbar" :class="{ show: tasks.length > 0 }">
    <span class="flex-grow">
      <span class="amount-selected">{{ tasks.length }}</span
      >{{ $t("msg.itemsSelected") }}
    </span>
    <div class="d-flex gap-3">
      <button v-b-modal="'Undo-Bulk-Tasks'" class="btn-delete">{{ $t("button.undo") }}</button>
      <button @click="handleCloseButton" class="btn-close">X</button>
    </div>
    <ConfirmModal
      :modal-id="'Undo-Bulk-Tasks'"
      :header="$t('title.undoTask')"
      :body="$t('msg.undoTasks')"
      @confirm="!!$event && undoBulk()"
    />
  </div>
</template>

<style scoped>
@import "./BulkUndoToolbar.scss";
</style>
