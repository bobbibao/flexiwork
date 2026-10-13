<script lang="ts">
import LocationQr from "./LocationQr";
export default LocationQr;
</script>

<template>
  <div class="sn-qr">
    <p class="sn-muted">{{ $t("sn.shift.qrHint") }}</p>
    <p v-if="error" class="text-danger">{{ error }}</p>
    <img v-if="image" :src="image" :alt="$t('sn.shift.showQr')" />
    <div class="sn-qr-code" data-test="qr-token">{{ token }}</div>
    <div class="sn-muted">{{ $t("sn.shift.qrExpires", { seconds }) }}</div>
  </div>
</template>
