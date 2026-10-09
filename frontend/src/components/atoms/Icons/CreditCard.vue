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
  <svg :width="width" :height="height" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="22" fill="#101828" />
    <path
      d="M12.833 20.3359H31.1663M14.4997 15.3359H29.4997C30.4201 15.3359 31.1663 16.0821 31.1663 17.0026V27.0026C31.1663 27.9231 30.4201 28.6693 29.4997 28.6693H14.4997C13.5792 28.6693 12.833 27.9231 12.833 27.0026V17.0026C12.833 16.0821 13.5792 15.3359 14.4997 15.3359Z"
      stroke="#FCFCFD"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
