<script lang="ts">
import ShareDialog from "./ShareDialog";
export default ShareDialog;
</script>

<template>
  <b-modal
    :visible="isVisible"
    @change="updateVisibility"
    hide-footer
    no-close-on-backdrop
    size="md"
    :title="`${$t('title.connectProject')}`"
    @close="onClose"
  >
    <div v-for="(item, i) in connections" :key="i" class="mb-4">
      <div class="connected-company-name">
        {{ item.name }}
      </div>
      <div class="mt-2">
        <b-form-select
          v-model="item.connected"
          :options="item.projects"
          text-field="name"
          value-field="id"
        ></b-form-select>
      </div>
    </div>

    <div class="row mt-6">
      <div class="col-md-6">
        <ButtonCustom
          :text="`${$t('button.delete')}`"
          size="sm"
          variant="secondary-gray"
          customClass="w-100 justify-content-center"
          @click="onDelete"
        />
      </div>
      <div class="col-md-6">
        <ButtonCustom
          :text="`${$t('button.confirm')}`"
          size="sm"
          variant="primary"
          customClass="w-100 justify-content-center"
          @click="onConfirm"
        />
      </div>
    </div>
  </b-modal>
</template>

<style lang="scss" scoped>
@import "./ShareDialog.scss";
</style>
