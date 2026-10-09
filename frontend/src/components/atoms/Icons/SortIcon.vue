<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  orderField: {
    type: String,
    required: true
  },
  currentOrder: {
    type: String,
    required: true
  },
  width: {
    type: String,
    default: "12"
  },
  height: {
    type: String,
    default: "12"
  }
});
</script>

<template>
  <svg
    class="ml-1"
    :class="{
      'rotate-180': currentOrder.startsWith(`${orderField}:asc`),
      'd-none': !currentOrder.startsWith(orderField)
    }"
    :width="width"
    :height="height"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.99967 1.33301V10.6663M5.99967 10.6663L10.6663 5.99967M5.99967 10.6663L1.33301 5.99967"
      stroke="#475467"
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
