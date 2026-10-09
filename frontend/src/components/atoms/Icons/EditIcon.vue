<!-- eslint-disable max-len -->
<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
  width: {
    type: Number,
    default: 18
  },
  height: {
    type: Number,
    default: 17
  },
  stroke: {
    type: String,
    default: "#475467"
  }
});
</script>

<template>
  <svg :width="width" :height="height" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 15.6662H16.5M12.75 1.9162C13.0815 1.58468 13.5312 1.39844 14 1.39844C14.2321 1.39844 14.462 1.44416 14.6765 1.533C14.891 1.62184 15.0858 1.75205 15.25 1.9162C15.4142 2.08036 15.5444 2.27523 15.6332 2.48971C15.722 2.70418 15.7678 2.93406 15.7678 3.1662C15.7678 3.39835 15.722 3.62822 15.6332 3.8427C15.5444 4.05718 15.4142 4.25205 15.25 4.4162L4.83333 14.8329L1.5 15.6662L2.33333 12.3329L12.75 1.9162Z"
      stroke="#475467"
      stroke-width="1.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
