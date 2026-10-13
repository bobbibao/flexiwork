<script lang="ts">
import SnAlert from "./SnAlert";
export default SnAlert;
</script>

<template>
  <div v-if="message" class="alert" :class="`alert-custom alert-light-${variant}`" role="alert" data-test="sn-alert">
    <div class="alert-text">{{ message }}</div>
  </div>
</template>
