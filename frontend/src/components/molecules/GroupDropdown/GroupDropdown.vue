<script lang="ts">
import GroupDropdown from "./GroupDropdown";
export default GroupDropdown;
</script>

<template>
  <div ref="dropdownRef" :class="['c-select-group', customClassName]">
    <ButtonCustom custom-class="b-max-w" :text="$t('button.viewOptions')" :variant="variant" @click="toggleDropdown">
      <template #end-icon>
        <div class="ml-2">
          <ChevronDownIcon v-show="showDropdown == false" />
          <ChevronUpIcon v-show="showDropdown == true" isExpanded="" />
        </div>
      </template>
    </ButtonCustom>
    <div v-show="showDropdown" class="dropdown-container">
      <!-- Main groups (Projects) -->
      <template v-for="group in displayOptions">
        <div :key="randString(10) + '-' + group.label" class="dropdown-main" @click="toggleExpand(group, $event)">
          <div class="checkbox-item">
            <div class="custom-checkbox">
              <input
                type="checkbox"
                v-model="group.selected"
                :indeterminate="group.indeterminate"
                @change="toggleGroupCheckbox(group, $event)"
                @click.stop
              />
              <label></label>
            </div>
            <span class="item-text" :title="group.label">{{ truncate(group.label, 25) }}</span>
          </div>
          <svg
            :class="['chevron', { 'chevron-up': group.expanded }]"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            style="cursor: pointer;"
          >
            <path d="M7 10l5 5 5-5z" fill="currentColor" />
          </svg>
        </div>

        <!-- Nested items (Product-Task combinations) -->
        <div v-if="group.expanded" class="nested-items" :key="'nested-' + group.label">
          <div v-for="option in group.options" :key="option.value" class="option-item">
            <div class="checkbox-item">
              <div class="custom-checkbox">
                <input
                  type="checkbox"
                  :value="option.value"
                  v-model="selected"
                  @change="$emit('filterProjects', selected)"
                  @click.stop
                />
                <label></label>
              </div>
              <div class="item-content">
                <span class="item-title" :title="option.label">{{ truncate(option.label, 25) }}</span>
                <span v-if="option.desc" class="item-subtitle" :title="option.desc">{{
                  truncate(option.desc, 30)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Show All option -->
      <div class="checkbox-item show-all">
        <div class="custom-checkbox">
          <input type="checkbox" v-model="allSelected" :indeterminate="indeterminate" @change="toggleAll" />
          <label></label>
        </div>
        <span class="item-text">{{ $t("button.showAll") }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "./GroupDropdown.scss";
</style>
