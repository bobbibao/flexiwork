<script lang="ts">
import SnNotificationBell from "./SnNotificationBell";
export default SnNotificationBell;
</script>

<template>
  <div class="sn-bell">
    <button type="button" class="btn btn-icon btn-light btn-sm position-relative" :aria-label="$t('sn.nav.notifications')" data-test="sn-bell" @click="open = !open">
      <i class="la la-bell icon-lg"></i>
      <span v-if="store.unread" class="sn-bell-count" data-test="sn-bell-count">{{ store.unread > 99 ? "99+" : store.unread }}</span>
    </button>
    <div v-if="open" class="sn-bell-panel">
      <div class="sn-row px-3 py-2 border-bottom">
        <strong>{{ $t("sn.notifications.title") }}</strong>
        <button v-if="store.unread" class="btn btn-link btn-sm p-0" @click="store.markAllRead()">{{ $t("sn.notifications.markAll") }}</button>
      </div>
      <div v-if="!store.items.length" class="sn-empty">{{ $t("sn.notifications.empty") }}</div>
      <a v-for="n in store.items.slice(0, 8)" :key="n.id" href="#" class="sn-bell-item" :class="{ unread: !n.read_at }" @click.prevent="go(n)">
        <div class="font-weight-bold">{{ n.title }}</div>
        <div class="sn-muted">{{ n.body }}</div>
        <div class="sn-muted small">{{ formatDateTimeVn(n.created_at) }}</div>
      </a>
      <router-link to="/sn/notifications" class="d-block text-center py-2 border-top" @click="open = false">{{ $t("sn.common.details") }}</router-link>
    </div>
    <div v-if="toast" class="sn-toast" role="status" data-test="sn-toast" @click="go(toast)">
      <div class="font-weight-bold">{{ toast.title }}</div>
      <div>{{ toast.body }}</div>
    </div>
  </div>
</template>

<style lang="scss" src="./SnNotificationBell.scss"></style>
