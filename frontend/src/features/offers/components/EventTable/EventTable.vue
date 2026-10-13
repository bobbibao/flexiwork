<script lang="ts">
import EventTable from "./EventTable";
import i18n from "@/core/plugins/vue-i18n";

export default {
  ...EventTable,
  i18n
};
</script>

<template>
  <div class="events-table-block">
    <draggable
      :item-key="(el) => events.indexOf(el)"
      class="events-table w-100"
      ghost-class="ghost"
      :list="events"
      handle=".draggable-button"
      :disabled="isDisabled"
    >
      <template #item="{ element: event, index: index }">
        <div class="event-row d-flex flex-row col-12 gap-4">
          <div class="col-5 px-0">
            <b-form-input
              placeholder="Enter label"
              v-model="event.label"
              size="sm"
              @change="updateEvent(index, { label: $event })"
              :disabled="isDisabled"
            ></b-form-input>
          </div>
          <div class="col-5 px-0">
            <b-form-input
              placeholder="Enter value"
              v-model="event.value"
              size="sm"
              @change="updateEvent(index, { value: $event })"
              :disabled="isDisabled"
            ></b-form-input>
          </div>
          <div class="actions col-2 px-0">
            <span class="draggable-button" :class="{ disabled: isDisabled }">
              <ChevronMove width="20" height="20" />
            </span>
            <span @click="!isDisabled && deleteEvent(index)" :class="{ disabled: isDisabled }">
              <Trash2 :width="20" :height="20" />
            </span>
          </div>
        </div>
      </template>
    </draggable>
    <div class="events-table-button" v-if="!isDisabled">
      <button type="button" variant="link" @click="addEvent()">
        <span><PlusIconOutline width="14" height="14" />{{ " " + $t("button.add") }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "./EventTable.scss";
</style>
