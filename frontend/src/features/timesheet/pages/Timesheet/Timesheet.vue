<script lang="ts">
import TimesheetPage from "./Timesheet";
export default TimesheetPage;
</script>

<template>
  <div class="timesheet-page">
    <div class="archapp-wrapper bg-white rounded-lg border border-secondary w-100 overflow-auto position-relative">
      <div class="py-3 px-6 mb-0 sticky bg-white top-0 z-10 top-section">
        <!-- 1st Top section -->
        <div class="d-flex justify-content-between">
          <SearchInput @onSearch="handleOnSearch($event)" />
          <div class="d-flex action-button-section gap-2">
            <!-- My timesheet -->
            <ButtonCustom :text="$t('timesheet.personal')" :variant="'secondary-gray'" @click="handleMyTimesheet">
              <template #start-icon>
                <UserIcon width="30" height="35" />
              </template>
            </ButtonCustom>
            <!-- Group dropdown -->
            <GroupDropdown
              ref="groupDropdown"
              :displayOptions="viewOptions"
              @filterProjects="handleViewOptionsChange"
              @initializeOptions="initializeViewOptions"
              @applyOptions="applyViewOptions"
            />
            <!-- Add button -->
            <template>
              <ButtonCustom :text="$t('button.add')" :variant="'primary'" @click="openAddTimeSheet">
                <template #start-icon>
                  <PlusIcon width="30" height="35" />
                </template>
              </ButtonCustom>
            </template>
          </div>
        </div>
        <!--2nd Top section -->
        <div class="d-flex justify-content-between">
          <div class="d-flex left-actions">
            <template v-if="isAdmin">
              <Dropdown :options="users" @optionsChange="handleOptionChanges($event, 'user')" />
            </template>
            <Dropdown :options="scopeOptions" @optionsChange="handleOptionChanges($event, 'scope')" />
            <!-- <DateRangePickerButton /> -->
            <DateRangePicker @dateRangeSelected="handleDateRangeSelected" />
          </div>
          <div class="d-flex right-actions">
            <ButtonCustom :text="$t('button.unlockWork')" :variant="'secondary-gray'" @click="openReportModal(false)">
            </ButtonCustom>
            <ButtonCustom :text="$t('button.lockWork')" :variant="'secondary-gray'" @click="openReportModal(true)">
            </ButtonCustom>
          </div>
        </div>
      </div>

      <ReportModal
        :visible.sync="reportVisible"
        :is-lock-mode="isLockMode"
        @cancel="cancelReport"
        @confirm="confirmReport($event)"
      />

      <TimesheetModal
        :selectingUserId="getSelectingUserId()"
        :isVisible="addTimeSheetVisible"
        @closed="cancelAddTimeSheet"
        @onSave="handleSaveTimesheet"
      />

      <!-- Table section -->
      <template v-if="loading">
        <div class="d-flex w-100 justify-content-center pt-2 text-danger">
          <b-spinner class="align-middle" />
        </div>
      </template>

      <template v-else>
        <template v-if="projects.length > 0">
          <TimesheetTable
            ref="timesheetTable"
            :projects="projects"
            :projectsForSummary="projectsForSummary"
            :viewMode="selectedDate"
            :startDate="startDate"
            :endDate="endDate"
            :daysCount="daysCount"
            :selectedUser="selectedUser"
            @updateWorkLog="(workLog, isCommentOnly) => handleUpdateWorkLog(workLog, isCommentOnly)"
          />
        </template>

        <template v-else>
          <div class="no-data">
            {{ $t("msg.noRecords") }}
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
@import "./Timesheet.scss";
</style>
