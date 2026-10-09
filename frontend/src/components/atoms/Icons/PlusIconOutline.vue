<template>
  <svg :width="width" :height="height" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_3564_10442)">
      <path d="M9.99935 6.66406V13.3307M6.66602 9.9974H13.3327M18.3327 9.9974C18.3327 14.5998 14.6017 18.3307 9.99935 18.3307C5.39698 18.3307 1.66602 14.5998 1.66602 9.9974C1.66602 5.39502 5.39698 1.66406 9.99935 1.66406C14.6017 1.66406 18.3327 5.39502 18.3327 9.9974Z" stroke="#006BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    <defs>
      <clipPath id="clip0_3564_10442">
        <rect width="20" height="20" fill="white"/>
      </clipPath>
    </defs>
  </svg>
</template>

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