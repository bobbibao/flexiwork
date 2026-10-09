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
  <svg :width="width" :height="height" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.25065 5.24967H5.25898M16.5757 10.5913L10.6007 16.5663C10.4459 16.7213 10.262 16.8442 10.0597 16.9281C9.85739 17.012 9.64051 17.0552 9.42148 17.0552C9.20246 17.0552 8.98558 17.012 8.78325 16.9281C8.58092 16.8442 8.39711 16.7213 8.24232 16.5663L1.08398 9.41634V1.08301H9.41732L16.5757 8.24134C16.8861 8.55361 17.0603 8.97603 17.0603 9.41634C17.0603 9.85665 16.8861 10.2791 16.5757 10.5913Z"
      stroke="#667085"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
