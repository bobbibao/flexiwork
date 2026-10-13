<script lang="ts">
import SnLayout from "./SnLayout";
export default SnLayout;
</script>

<template>
  <div class="sn-app" lang="vi">
    <header class="sn-header">
      <router-link :to="session.home" class="sn-brand">{{ $t("sn.app.name") }}</router-link>
      <nav class="sn-nav" :aria-label="$t('sn.nav.menu')">
        <router-link v-for="item in nav" :key="item.to" :to="item.to" :data-test="`nav-${item.key}`">{{ $t(`sn.nav.${item.key}`) }}</router-link>
      </nav>
      <div class="sn-spacer"></div>
      <SnNotificationBell />
      <div class="sn-user">
        <span class="sn-user-name" data-test="sn-user-name">{{ session.companyName || session.displayName }}</span>
        <span class="label label-light-primary label-inline">{{ session.role ? $t(`sn.roles.${session.role}`) : "" }}</span>
        <button type="button" class="btn btn-sm btn-light" data-test="sn-logout" @click="logout">{{ $t("sn.common.logout") }}</button>
      </div>
    </header>
    <main class="sn-main">
      <!-- keyed by path: /shifts/A -> /shifts/B must re-run setup() (vue-router reuses the instance otherwise) -->
      <router-view :key="$route.path" />
    </main>
    <nav class="sn-bottom-nav" :aria-label="$t('sn.nav.menu')">
      <router-link v-for="item in nav" :key="item.to" :to="item.to"><i class="la" :class="item.icon"></i>{{ $t(`sn.nav.${item.key}`) }}</router-link>
    </nav>
  </div>
</template>

<style lang="scss" src="../../styles/sn.scss"></style>
