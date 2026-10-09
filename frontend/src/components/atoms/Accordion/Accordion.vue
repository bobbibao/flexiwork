<script lang="ts">
import Accordion from "./Accordion";
export default Accordion;
</script>

<template>
  <div class="custom-accordion">
    <b-card-header header-tag="header" :class="['p-0', headerClass]" role="tab">
      <div v-if="headerType == 'button'">
        <b-button
          v-if="!isAlwaysOpen"
          block
          :v-b-toggle="accordionId"
          :variant="customHeaderVariant"
          @click="toggleAccordion"
          :class="['btn-accordion', isOpen ? 'show-border-radius' : 'hidden-border-radius', headerClass]"
        >
          <slot name="title"></slot>
          <b-icon :icon="isOpen ? 'chevron-up' : 'chevron-down'" />
        </b-button>
        <b-button
          v-else
          block
          :variant="customHeaderVariant"
          :class="[headerClass ? headerClass : 'btn-accordion show-border-radius']"
        >
          <slot name="title"></slot>
        </b-button>
      </div>
      <div v-else-if="headerType == 'div'">
        <div v-if="!isAlwaysOpen" :v-b-toggle="accordionId" @click.stop="toggleAccordion" class="div-accordion-header">
          <slot name="title"></slot>
          <b-icon :icon="isOpen ? 'chevron-up' : 'chevron-down'" />
        </div>
        <div v-else class="div-accordion-header">
          <slot name="title"></slot>
        </div>
      </div>
    </b-card-header>
    <b-collapse :id="accordionId" :visible="isAlwaysOpen ? true : isOpen" :accordion="accordionId" role="tabpanel">
      <b-card-body :class="['collapse-body', isShowBorder ? 'body-border' : '', bodyClass]">
        <slot name="body"></slot>
      </b-card-body>
    </b-collapse>
  </div>
</template>

<style lang="scss" scoped>
@import "./Accordion.scss";
</style>
