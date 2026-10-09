<!-- eslint-disable max-len -->
<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  width: {
    type: String,
    default: "20"
  },
  height: {
    type: String,
    default: "20"
  }
});
</script>

<template>
  <svg :width="width" :height="height" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3333 1.66406V4.9974M6.66667 1.66406V4.9974M2.5 8.33073H17.5M4.16667 3.33073H15.8333C16.7538 3.33073 17.5 4.07692 17.5 4.9974V16.6641C17.5 17.5845 16.7538 18.3307 15.8333 18.3307H4.16667C3.24619 18.3307 2.5 17.5845 2.5 16.6641V4.9974C2.5 4.07692 3.24619 3.33073 4.16667 3.33073Z"
      stroke="#344054"
      stroke-width="1.67"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
