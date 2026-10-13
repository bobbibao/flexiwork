<script lang="ts">
import SnTimeline from "./SnTimeline";
export default SnTimeline;
</script>

<template>
  <ul class="list-unstyled m-0" data-test="sn-timeline">
    <li v-for="e in events" :key="e.version" class="d-flex py-2 border-bottom">
      <span class="text-primary mr-3"><i class="la la-check-circle"></i></span>
      <div class="flex-grow-1">
        <div class="font-weight-bold">{{ $te(`sn.events.${e.type}`) ? $t(`sn.events.${e.type}`) : e.type }}</div>
        <div class="sn-muted">{{ formatDateTimeVn(e.occurred_at) }} · {{ $t(`sn.events.actor.${e.actor?.type || "system"}`) }}</div>
      </div>
    </li>
  </ul>
</template>
