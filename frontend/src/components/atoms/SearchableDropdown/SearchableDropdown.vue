<script lang="ts">
import SearchableDropdown from "./SearchableDropdown";
export default SearchableDropdown;
</script>

<template>
  <div class="searchable-dropdown position-relative">
    <input
      ref="searchInput"
      class="form-control"
      type="text"
      :placeholder="String($t('task.taskDetail.select'))"
      :disabled="disabled"
      @click="showDropdownPanel = true"
      @keyup="onSearch()"
    />

    <button
      ref="toggleButton"
      class="toggle-button position-absolute top-1/2 -translate-y-1/2 right-2"
      :class="{ active: showDropdownPanel }"
      :disabled="disabled"
      type="button"
      @click="toggleDropdown()"
    >
      <svg data-v-25cf78af="" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          data-v-25cf78af=""
          d="M5 7.5L10 12.5L15 7.5"
          stroke="#667085"
          stroke-width="1.66667"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
    </button>

    <div v-show="showDropdownPanel" ref="dropdown" class="dropdown-panel">
      <ul>
        <li
          v-for="option in displayOptions"
          :key="'Option-' + option.id"
          :class="{ selected: selectedOption && selectedOption.id === option.id }"
          @click="selectOption(option)"
        >
          <slot name="option" :option="option"></slot>
        </li>
        <li class="option-empty" v-if="displayOptions.length === 0">
          {{ $t("timesheet.empty") }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
@import "./SearchableDropdown.scss";
</style>
