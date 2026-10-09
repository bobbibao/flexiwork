<script setup lang="ts">
import { defineProps } from 'vue';

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
  <svg :width="width" :height="height" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" enable-background="false">
    <path d="M15 6.66927L10 1.66927L5 6.66927M5 13.3359L10 18.3359L15 13.3359" stroke="#475467" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>