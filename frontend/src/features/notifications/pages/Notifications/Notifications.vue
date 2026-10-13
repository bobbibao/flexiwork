<script lang="ts">
import SnNotificationsPage from "./Notifications";
export default SnNotificationsPage;
</script>

<template>
  <div>
    <div class="sn-row mb-3">
      <h1 class="sn-page-title">{{ $t("sn.notifications.title") }}</h1>
      <button v-if="store.unread" class="btn btn-light btn-sm" @click="store.markAllRead()">{{ $t("sn.notifications.markAll") }}</button>
    </div>
    <SnAlert :message="error" />
    <div class="sn-card">
      <div class="sn-row">
        <span>
          <span v-if="store.pushState === 'enabled'">{{ $t("sn.notifications.pushEnabled") }}</span>
          <span v-else-if="store.pushState === 'denied'">{{ $t("sn.notifications.pushDenied") }}</span>
          <span v-else-if="store.pushState === 'unsupported'">{{ $t("sn.notifications.pushUnsupported") }}</span>
          <span v-else>{{ $t("sn.notifications.enablePush") }}</span>
        </span>
        <button v-if="store.pushState === 'available'" class="btn btn-primary btn-sm" data-test="enable-push" @click="enablePush">{{ $t("sn.notifications.enablePush") }}</button>
        <span v-if="store.connected" class="label label-light-success label-inline">{{ $t("sn.notifications.live") }}</span>
      </div>
    </div>
    <div v-if="!store.items.length" class="sn-card sn-empty">{{ $t("sn.notifications.empty") }}</div>
    <a v-for="n in store.items" :key="n.id" href="#" class="sn-card sn-list-item" :class="{ 'border-left border-primary': !n.read_at }" data-test="notification-item" @click.prevent="open(n)">
      <div class="font-weight-bold">{{ n.title }}</div>
      <div>{{ n.body }}</div>
      <div class="sn-muted">{{ formatDateTimeVn(n.created_at) }}</div>
    </a>
  </div>
</template>
