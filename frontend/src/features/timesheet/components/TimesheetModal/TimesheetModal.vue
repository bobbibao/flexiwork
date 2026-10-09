<script lang="ts">
import TimesheetModal from "./TimesheetModal";
export default TimesheetModal;
</script>

<template>
  <b-modal v-model="isVisible" hide-footer no-close-on-esc no-close-on-backdrop hide-header header-border-variant>
    <div class="timesheet-modal-container">
      <h5 class="font-weight-bolder">{{ $t("title.confirm") }}</h5>
      <div class="col-md-12 p-0 mt-6">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.project") }}
        </div>
        <SearchableDropdown
          :options="projects"
          :selectedOption="selectedProject || {}"
          :searchFunction="searchProject"
          :showSelectedOptionFunction="showItemName"
          @onSelectOption="handleOnChangeProject"
        >
          <template #option="{ option }">
            <div>
              <span>{{ option.name }}</span>
            </div>
          </template>
        </SearchableDropdown>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.service") }}
        </div>
        <SearchableDropdown
          :options="products"
          :selectedOption="selectedProduct || {}"
          :searchFunction="searchProduct"
          :showSelectedOptionFunction="showItemName"
          @onSelectOption="handleChangeProduct"
        >
          <template #option="{ option }">
            <div>
              <span class="ml-2">{{ option.id }}</span>
              -
              <span>{{ option.name }}</span>
            </div>
          </template>
        </SearchableDropdown>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.task") }}
        </div>
        <div class="task-dropdown-container">
          <b-dropdown id="task-select" no-caret toggle-class="w-100" auto-close="false">
            <template #button-content>
              <div class="label-dropdown d-flex align-items-center justify-content-between">
                <span v-if="selectedTasks.length > 0"> {{ selectedTasks.length }} task(s) selected </span>
                <span v-else style="opacity: 0.8;">
                  {{ $t("timesheet.selectTask") }}
                </span>
                <ChevronDownIcon :width="20" :height="20" />
              </div>
            </template>
            <div class="task-dropdown-menu">
              <div class="search-input-tasks mb-2">
                <input
                  type="text"
                  v-model="taskSearchQuery"
                  :placeholder="$t('timesheet.selectTasks') + '...'"
                  class="form-control"
                />
              </div>
              <div class="task-list">
                <template v-if="filteredTasks.length > 0">
                  <div
                    class="task-item"
                    v-for="task in filteredTasks"
                    :key="task.id"
                    @click.stop="handleChangeTasks(task)"
                    :class="{
                      'task-item': task.work_items?.length == 0,
                      'task-item-disabled': task.work_items && task.work_items.length > 0
                    }"
                  >
                    <div class="custom-checkbox">
                      <input
                        type="checkbox"
                        :id="`task-${task.id}`"
                        :checked="isTaskSelected(task)"
                        :disabled="task.work_items && task.work_items.length > 0"
                      />
                      <label :for="`task-${task.id}`"></label>
                    </div>
                    <div class="task-name user-select-none">
                      <span
                        v-b-tooltip.html.d300.hover
                        :title="generateTooltipContent(task.name)"
                        custom-class="custom-tooltip"
                      >
                        {{ task.name }}
                      </span>
                    </div>
                  </div>
                </template>
                <div v-else class="no-tasks-message">
                  {{ $t("timesheet.noTask") }}
                </div>
              </div>
            </div>
          </b-dropdown>
        </div>
      </div>

      <div class="col-md-12 p-0 mt-12 d-flex flex-row justify-content-between">
        <b-button
          variant="secondary"
          class="cancel-btn w-100 text-center mr-2 transparent-btn"
          @click="!isChangeForm && handleCloseModal()"
          v-b-modal="'drawer-close'"
        >
          {{ $t("button.cancel") }}
        </b-button>
        <b-button
          variant="primary"
          class="save-btn w-100 text-center ml-2"
          style="float: right"
          @click="submit"
          :disabled="loading"
        >
          {{ $t("button.confirm") }}
        </b-button>
      </div>
      <ConfirmModal
        v-if="isChangeForm"
        :modal-id="'drawer-close'"
        header="Close Add Timesheet"
        :body="'All unsaved changes will be lost upon closing.'"
        @confirm="!!$event && handleCloseModal()"
      />
    </div>
  </b-modal>
</template>

<style lang="scss" scoped>
@import "./TimesheetModal.scss";
</style>
