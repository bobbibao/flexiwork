<script lang="ts">
import SelectInput from "./SelectInput";
export default SelectInput;
</script>

<template>
  <div ref="dropdownElementRef" :class="['c-select-input', customClass]">
    <ButtonCustom
      custom-class="b-max-w"
      :text="selectedOptionLabel"
      :variant="variant"
      :size="size"
      @click="toggleDropdown"
    >
      <template #end-icon>
        <div class="ml-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#667085"
              stroke-width="1.66667"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </template>
    </ButtonCustom>

    <div v-show="showDropdownPanel" class="c-dropdown-container">
      <div class="c-dropdown-items">
        <template v-for="option in displayOptions">
          <div
            v-bind:key="randString(10) + '-' + option.value"
            @click="changeOption(option)"
            :class="['c-dropdown-item', option.selected ? 'selected' : '']"
          >
            <div class="c-dropdown-item-text">
              {{ option.label }}
            </div>
            <div v-if="option.selected">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16.6667 5L7.50001 14.1667L3.33334 10"
                  stroke="#2884EF"
                  stroke-width="1.66667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style type="scss" scoped>
@import "./SelectInput.scss";
</style>
