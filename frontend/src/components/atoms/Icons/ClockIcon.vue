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
    <g clip-path="url(#clip0_5337_34843)">
      <path
        d="M10.0003 4.9974V9.9974L13.3337 11.6641M18.3337 9.9974C18.3337 14.5998 14.6027 18.3307 10.0003 18.3307C5.39795 18.3307 1.66699 14.5998 1.66699 9.9974C1.66699 5.39502 5.39795 1.66406 10.0003 1.66406C14.6027 1.66406 18.3337 5.39502 18.3337 9.9974Z"
        stroke="#344054"
        stroke-width="1.67"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_5337_34843">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
</template>
