<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  width: {
    type: Number,
    default: 20
  },
  height: {
    type: Number,
    default: 20
  }
});
</script>

<template>
  <svg :width="width" :height="height" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5 15L7.5 10L12.5 5"
      stroke="#344054"
      stroke-width="1.67"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
