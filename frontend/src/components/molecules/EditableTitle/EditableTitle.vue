<script lang="ts">
import EditableTitle from "./EditableTitle";
export default EditableTitle;
</script>

<template>
  <div class="title-container position-relative" @keydown.space.prevent>
    <!-- Title text that shows when not editing -->
    <div
      v-if="!isEditing"
      class="d-flex align-items-start title-wrapper"
      @mouseenter="showEditButton = true"
      @mouseleave="showEditButton = false"
      ref="titleText"
    >
      <h4 class="mb-0">{{ value }}</h4>

      <!-- Edit button that appears on hover -->
      <button type="button" v-show="showEditButton && !disabled" class="edit-button ml-2" @click.stop="startEditing">
        <EditIcon :width="19" :height="19" />
      </button>
    </div>

    <!-- Input that shows when editing -->
    <div v-if="isEditing" class="input-wrapper">
      <b-form-input
        v-if="isEditing"
        v-model="editValue"
        class="edit-input"
        :disabled="disabled"
        @blur="finishEditing"
        @keydown="handleKeydown"
        @keyup.esc="cancelEditing"
        @keyup.space="addSpace"
        @click.stop
        ref="editInput"
        :style="{ width: inputWidth + 'px' }"
        :class="{ 'is-invalid': editValue.trim() === '' }"
      ></b-form-input>
      <button type="button" class="submit-button" @click.stop="finishEditing">
        <i class="fas fa-check"></i>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "./EditableTitle.scss";
</style>
