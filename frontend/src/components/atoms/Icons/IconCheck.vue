<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
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
    :width="width"
    :height="height"
    class="checkmark"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
  </svg>
</template>
