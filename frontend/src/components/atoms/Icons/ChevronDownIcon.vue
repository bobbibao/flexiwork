<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  width: {
    type: Number,
    default: 14
  },
  height: {
    type: Number,
    default: 14
  }
});
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="width" :height="height" fill="none" viewBox="0 0 20 20">
    <path stroke="#667085" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M5 7.5l5 5 5-5" />
  </svg>
</template>
