<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  width: {
    type: Number,
    default: 14
  },
  height: {
    type: Number,
    default: 14
  }
});
</script>

<template>
  <svg
    :width="width"
    :height="height"
    class="checkmark"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <g clip-path="url(#clip0_4046_14659)">
      <path
        d="M0.833496 10.0026C0.833496 10.0026 4.16683 3.33594 10.0002 3.33594C15.8335 3.33594 19.1668 10.0026 19.1668 10.0026C19.1668 10.0026 15.8335 16.6693 10.0002 16.6693C4.16683 16.6693 0.833496 10.0026 0.833496 10.0026Z"
        stroke="#344054"
        stroke-width="1.67"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10.0002 12.5026C11.3809 12.5026 12.5002 11.3833 12.5002 10.0026C12.5002 8.62189 11.3809 7.5026 10.0002 7.5026C8.61945 7.5026 7.50016 8.62189 7.50016 10.0026C7.50016 11.3833 8.61945 12.5026 10.0002 12.5026Z"
        stroke="#344054"
        stroke-width="1.67"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_4046_14659">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
</template>
