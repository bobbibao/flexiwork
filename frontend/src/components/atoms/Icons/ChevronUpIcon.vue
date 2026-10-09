<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  isExpanded: {
    type: Boolean,
    required: true
  },
  width: {
    type: String,
    default: "14"
  },
  height: {
    type: String,
    default: "14"
  }
});
</script>

<template>
  <svg
    class="transition-all"
    :class="{ 'rotate-180': !isExpanded }"
    :width="width"
    :height="height"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 12.5L10 7.5L5 12.5"
      stroke="#344054"
      stroke-width="1.67"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
