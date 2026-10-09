<script lang="ts">
import InternalDesc from "./InternalDesc";
export default InternalDesc;
</script>

<template>
  <div class="internal-desc">
    <Accordion name="internal-desc" :alwaysOpen="true">
      <template #title>{{ $t("offer.internalDesc") }}</template>
      <template #body>
        <div class="d-flex flex-row flex-wrap justify-content-between">
          <div class="d-inline-flex gap-2 col-3 px-0" v-for="(item, i) in internalDesc" :key="i">
            <div
              class="d-flex"
              @click="!isDisabled && updateInternalDesc(item.label)"
              :class="{ disabled: isDisabled }"
            >
              <input
                :id="`internal_choice_${i}`"
                type="checkbox"
                :checked="item.is_active"
                :disabled="isDisabled"
                class="cursor-pointer"
              />
              <p class="internal-desc-label" :class="{ 'cursor-pointer': !isDisabled }">
                {{ item.label }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </Accordion>
  </div>
</template>

<style lang="scss" scoped>
@import "./InternalDesc.scss";
</style>
