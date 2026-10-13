<script lang="ts">
import SnAuthLayout from "./SnAuthLayout";
export default SnAuthLayout;
</script>

<template>
  <div class="sn-auth" lang="vi">
    <div class="sn-auth-card">
      <div class="sn-auth-brand">
        <h1>{{ $t("sn.app.name") }}</h1>
        <p>{{ $t("sn.app.tagline") }}</p>
      </div>
      <router-view />
    </div>
  </div>
</template>

<style lang="scss" src="../../styles/sn.scss"></style>
