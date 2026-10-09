<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { BModal } from "bootstrap-vue";

interface Props {
  modalId: string;
  header?: string;
  body: string;
  cancelButtonLabel?: string;
  confirmButtonLabel?: string;
}
const props = defineProps<Props>();
const { modalId, header, body, cancelButtonLabel, confirmButtonLabel } = props;
const emitter = defineEmits<(event: "confirm", confirm: boolean) => void>();

const modal = ref<BModal | null>(null);

function cancel() {
  !!modal.value && modal.value.hide();
  emitter("confirm", false);
}
function confirm() {
  !!modal.value && modal.value.hide();
  emitter("confirm", true);
}
</script>

<template>
  <b-modal :id="modalId" ref="modal" centered hide-header hide-footer>
    <div class="confirm-modal-header d-flex justify-content-between align-items-center gap-4">
      <h6 class="d-inline-block">{{ header }}</h6>
      <button type="button" @click="cancel">
        x
      </button>
    </div>

    <div class="confirm-modal-body">
      <slot name="modal-body">
        {{ body }}
      </slot>
    </div>

    <div class="confirm-modal-footer d-flex justify-content-end gap-3">
      <b-button variant="light" @click="cancel">
        {{ cancelButtonLabel ?? $t("button.cancel") }}
      </b-button>
      <b-button variant="primary" @click="confirm">
        {{ confirmButtonLabel ?? $t("button.confirm") }}
      </b-button>
    </div>
  </b-modal>
</template>

<style scoped>
.confirm-modal-header {
  margin-bottom: 16px;
  & > * {
    font-size: 18px;
    color: black;
  }
}

.confirm-modal-body {
  font-size: 14px;
}

.confirm-modal-footer {
  margin-top: 16px;
}
</style>
