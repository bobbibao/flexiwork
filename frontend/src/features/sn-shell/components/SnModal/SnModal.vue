<script lang="ts">
import SnModal from "./SnModal";
export default SnModal;
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="sn-modal-backdrop" @click.self="$emit('close')">
      <div class="sn-modal" role="dialog" aria-modal="true" :aria-label="title">
        <div class="sn-modal-header">
          <h5 class="m-0">{{ title }}</h5>
          <button type="button" class="btn btn-sm btn-icon btn-light" :aria-label="$t('sn.common.close')" @click="$emit('close')"><i class="la la-times"></i></button>
        </div>
        <div class="sn-modal-body"><slot /></div>
      </div>
    </div>
  </teleport>
</template>

<style lang="scss" src="./SnModal.scss"></style>
