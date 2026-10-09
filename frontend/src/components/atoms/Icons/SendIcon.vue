<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  width: {
    type: String,
    default: "16.67"
  },
  height: {
    type: String,
    default: "16.67"
  }
});
</script>
<template>
  <svg :width="width" :height="height" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18.3327 1.66699L9.16602 10.8337M18.3327 1.66699L12.4993 18.3337L9.16602 10.8337M18.3327 1.66699L1.66602 7.50033L9.16602 10.8337"
      stroke="white"
      stroke-width="1.67"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
