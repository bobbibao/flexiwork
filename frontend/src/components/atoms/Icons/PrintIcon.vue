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
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_3201_25501)">
      <path
        d="M5.00008 7.4974V1.66406H15.0001V7.4974M5.00008 14.9974H3.33341C2.89139 14.9974 2.46746 14.8218 2.1549 14.5092C1.84234 14.1967 1.66675 13.7728 1.66675 13.3307V9.16406C1.66675 8.72204 1.84234 8.29811 2.1549 7.98555C2.46746 7.67299 2.89139 7.4974 3.33341 7.4974H16.6667C17.1088 7.4974 17.5327 7.67299 17.8453 7.98555C18.1578 8.29811 18.3334 8.72204 18.3334 9.16406V13.3307C18.3334 13.7728 18.1578 14.1967 17.8453 14.5092C17.5327 14.8218 17.1088 14.9974 16.6667 14.9974H15.0001M5.00008 11.6641H15.0001V18.3307H5.00008V11.6641Z"
        stroke="#475467"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3201_25501">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
</template>
