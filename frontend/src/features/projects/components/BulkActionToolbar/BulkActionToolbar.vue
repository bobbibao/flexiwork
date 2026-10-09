<script lang="ts">
import BulkActionToolbar from "./BulkActionToolbar";
export default BulkActionToolbar;
</script>

<template>
  <div class="d-flex align-items-center gap-4 position-fixed tool-bar-offer" :class="{ show: projects.length > 0 }">
    <span class="flex-grow">
      <span class="amount-selected">{{ projects.length }}</span> {{ $t("msg.itemsSelected") }}
    </span>
    <div class="d-flex gap-3">
      <button v-b-modal="'Copy-Bulk-Offers'" class="btn-edit icon-text-gap">
        <CopyIcon />
        {{ $t("button.copy") }}
      </button>
    </div>
    <ConfirmModal
      :modal-id="'Copy-Bulk-Offers'"
      header="Confirm"
      :body="'Copy all will take a while. Please be patient.'"
      @confirm="!!$event && copyBulk()"
    />
    <div class="d-flex gap-3">
      <button v-b-modal="'Print-Bulk-Offers'" class="btn-edit icon-text-gap">
        <PrintIcon /> {{ $t("button.print") }}
      </button>
    </div>
    <ConfirmModal
      :modal-id="'Print-Bulk-Offers'"
      header="Confirm"
      :body="'Print all will take a while. Please be patient.'"
      @confirm="!!$event && printBulk()"
    />
    <div class="d-flex gap-3">
      <button v-b-modal="'Update-Bulk-Projects'" class="btn-edit icon-text-gap">
        <EditIcon /> {{ $t("button.editStatus") }}
      </button>
      <button v-b-modal="'Delete-Bulk-Offers'" class="btn-delete icon-text-gap">
        <TrashIcon stroke="#B42318" />{{ $t("button.delete") }}
      </button>
      <button @click="handleCloseButton" class="btn-close">X</button>
    </div>
    <ConfirmModal
      :modal-id="'Delete-Bulk-Offers'"
      :header="$t('title.confirm')"
      :body="$t('msg.delOffer')"
      @confirm="!!$event && deleteBulk()"
    />
    <!-- Modal Update Status -->
    <ConfirmModal
      :modal-id="'Update-Bulk-Projects'"
      :header="$t('title.updateStatus')"
      :body="$t('msg.updateStatus')"
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
              <span>{{ selectedStatus.label }}</span>
              <CloseIcon />
            </div>
            <div class="label-dropdown" v-else>
              <span> Select</span>
            </div>
          </template>
          <template #option="{ data }">
            <span>
              {{ data.label }}
            </span>
          </template>
        </ButtonDropDown>
      </template>
    </ConfirmModal>
  </div>
</template>

<style scoped>
@import "./BulkActionToolbar.scss";
</style>
