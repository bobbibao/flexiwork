<script setup lang="ts">
import { defineProps, computed } from "vue";

const props = defineProps({
  width: {
    type: String,
    default: "8"
  },
  height: {
    type: String,
    default: "8"
  },
  color: {
    type: String,
    default: "#F04438"
  }
});
</script>

<template>
  <svg :width="width" :height="height" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="4" r="3" :fill="color" />
  </svg>
</template>
