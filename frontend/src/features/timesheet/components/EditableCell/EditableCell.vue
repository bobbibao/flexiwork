<script lang="ts">
import EditableCell from "./EditableCell";
export default EditableCell;
</script>

<template>
  <div class="editable-cell">
    <template v-if="isEditing">
      <input
        class="editable-input"
        ref="inputRef"
        v-model="editValue"
        @blur="handleBlur"
        @keydown="handleKeydown"
        type="text"
        inputmode="decimal"
      />
    </template>
    <template v-else>
      <span class="hour-text" @click="startEditing">
        {{ localValue.toFixed(2) }}h
        <span v-if="localComment" class="comment-indicator" :title="localComment"></span>
      </span>
    </template>
  </div>
</template>

<style scoped>
@import "./EditableCell.scss";
</style>
