<script lang="ts">
//@ts-nocheck
import Vue from "vue";

export default Vue.extend({
  name: "DropdownButton",
  props: {
    title: {
      type: String,
      required: false,
      default: "Select"
    },
    listData: {
      type: Array,
      required: true
    },
    customClass: {
      type: String,
      default: ""
    },
    onChange: {
      type: Function,
      default: () => {}
    },
    selectedData: {
      type: Object,
      default: () => ({})
    },
    keyField: {
      type: String,
      default: "id" // Default to `id`, can be overridden
    },
    displayField: {
      type: String,
      default: "name" // Default to `name`, can be overridden
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedValue: this.selectedData
    };
  },
  watch: {
    selectedData(newValue) {
      this.selectedValue = newValue;
    },
    selectedValue(newValue) {
      this.$emit("input", newValue);
    }
  }
});
</script>

<style scoped>
@import "./ButtonDropDownStyle.scss";
</style>

<template>
  <b-dropdown :class="customClass" id="dropdown" no-caret :disabled="disabled">
    <template #button-content>
      <slot name="title">
        <div style="text-overflow: ellipsis;">
          {{ title }}
        </div>
      </slot>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="#667085"
          stroke-width="1.66667"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </template>
    <!-- Use slot-scope for scoped slots in Vue 2 -->
    <b-dropdown-item-button v-for="data in listData" :key="data[keyField]" @click="onChange(data)">
      <slot name="option" :data="data">
        <!-- Default content if no slot is provided -->
        {{ data[displayField] }}
      </slot>
    </b-dropdown-item-button>
  </b-dropdown>
</template>
