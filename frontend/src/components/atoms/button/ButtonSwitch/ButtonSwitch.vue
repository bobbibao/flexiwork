<script lang="ts">
import ButtonSwitch from "./ButtonSwitch";
export default ButtonSwitch;
</script>

<template>
  <div class="btn-switch-panel border border-gray-200">
    <template v-for="option in displayOptions">
      <button
        v-bind:key="randString(10) + '-' + option.value"
        class="btn-switch-item"
        :class="{ active: option.selected }"
        type="button"
        @click="changeOption(option)"
      >
        {{ option.label }}
      </button>
    </template>
  </div>
</template>

<style scoped>
@import "./ButtonSwitch.scss";
</style>
