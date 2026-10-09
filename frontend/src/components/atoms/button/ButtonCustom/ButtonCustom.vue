<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "ButtonCustom",
  props: {
    size: {
      type: String as PropType<"sm" | "md" | "lg" | "xl" | "2xl" | "icon">,
      default: "lg"
    },
    text: {
      type: String,
      default: ""
    },
    variant: {
      type: String as PropType<
        "primary" | "secondary" | "secondary-gray" | "tertiary-color" | "tertiary-gray" | "link-color" | "link-gray"
      >,
      default: "primary"
    },
    disabled: {
      type: Boolean,
      default: false
    },
    customClass: {
      type: String,
      default: ""
    }
  },
  methods: {
    click(event: MouseEvent) {
      this.$emit("click", event);
    }
  }
});
</script>

<template>
  <div class="btn-container">
    <button
      :disabled="disabled"
      :class="['btn-custom', `size-${size}`, `variant-${variant}`, { 'only-icon': text === '' }, customClass]"
      type="button"
      @click="click"
    >
      <slot name="start-icon"></slot>
      <span v-if="text !== ''">{{ text }}</span>
      <slot name="end-icon"></slot>
    </button>
  </div>
</template>

<style>
@import "./index.scss";
</style>
