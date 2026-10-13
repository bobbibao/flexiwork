<script lang="ts">
import SnStatusBadge from "./SnStatusBadge";
export default SnStatusBadge;
</script>

<template>
  <span class="label label-inline font-weight-bold" :class="`label-light-${variant}`" :data-status="status">{{ $t(`sn.status.${status}`) }}</span>
</template>
