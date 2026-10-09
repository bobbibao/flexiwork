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
    <g clip-path="url(#clip0_3188_25511)">
      <path
        d="M4.16675 12.4974H3.33341C2.89139 12.4974 2.46746 12.3218 2.1549 12.0092C1.84234 11.6967 1.66675 11.2728 1.66675 10.8307V3.33073C1.66675 2.8887 1.84234 2.46478 2.1549 2.15222C2.46746 1.83966 2.89139 1.66406 3.33341 1.66406H10.8334C11.2754 1.66406 11.6994 1.83966 12.0119 2.15222C12.3245 2.46478 12.5001 2.8887 12.5001 3.33073V4.16406M9.16675 7.4974H16.6667C17.5872 7.4974 18.3334 8.24359 18.3334 9.16406V16.6641C18.3334 17.5845 17.5872 18.3307 16.6667 18.3307H9.16675C8.24627 18.3307 7.50008 17.5845 7.50008 16.6641V9.16406C7.50008 8.24359 8.24627 7.4974 9.16675 7.4974Z"
        stroke="#475467"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3188_25511">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
</template>
