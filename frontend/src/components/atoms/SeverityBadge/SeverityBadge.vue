<script lang="ts">
import SeverityBadge from "./SeverityBadge";
export default SeverityBadge;
</script>

<template>
  <div v-if="title" :class="['badge-container', `size-${size}`, customClass]" :style="badgeStyles">
    <DotIcon v-if="showDot" class="dot-icon" :color="color" />
    <span>{{ title }}</span>
  </div>
</template>

<style scoped>
@import "./SeverityBadge.scss";
</style>
