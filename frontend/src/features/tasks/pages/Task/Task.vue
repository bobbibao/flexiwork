<script lang="ts">
import TaskPage from "./Task";
export default TaskPage;
</script>

<template>
  <div class="archapp-wrapper bg-white rounded-lg border border-secondary w-100 overflow-auto position-relative">
    <div class="py-6 px-8 mb-0 sticky bg-white top-0 z-10">
      <div class="d-flex justify-content-between">
        <SearchInput @onSearch="handleOnSearch($event)" />

        <div class="d-flex action-button-section gap-2">
          <ButtonSwitch :options="assigneeSwitchOptions" @onChange="handleAssigneeSwitchChanged($event)" />

          <ButtonCustom :text="$t('button.add')" @click="toggleDrawer(true)">
            <template #start-icon>
              <PlusIcon width="30" height="35" />
            </template>
          </ButtonCustom>
        </div>
      </div>

      <div class="d-flex filter-section">
        <ButtonSwitch :options="viewSwitchOptions" @onChange="handleViewSwitchChanged($event)" />
        <ButtonFilterTasks
          :assignees="assigneeOptions"
          :statuses="statusOptions"
          :priorities="priorityOptions"
          @assigneeFilterChanged="handleAssigneeFilterChanged($event)"
          @statusFilterChanged="handleStatusFilterChanged($event)"
          @priorityFilterChanged="handlePriorityFilterChanged($event)"
        />
      </div>
    </div>

    <TableTasksByList
      v-if="viewType === 'list'"
      :tasksData="tasks"
      :selectedTasks="selectedTasks"
      :sortOrder="sortListTasks"
      :fetchingData="fetchingListTasks"
      @onSort="handleOnSortListTasks($event)"
      @onOpenDrawer="handleOnOpenDrawer($event)"
      @onDeleteTask="handleOnDeleteTask($event)"
      @onSelectTask="handleSelectTask"
      @toggleSelectAllTasksInTable="handleSelectAllTasks"
      @onTaskChangePage="fetchData"
    ></TableTasksByList>
    <TableTasksByDeletedAt
      v-else-if="viewType === 'softDeleted'"
      :tasksData="tasks"
      :selectedTasks="selectedTasks"
      :sortOrder="sortListTasks"
      :fetchingData="fetchingListTasks"
      @onSort="handleOnSortListTasks($event)"
      @onOpenDrawer="handleOnOpenDrawer($event)"
      @onSelectTask="handleSelectTask"
      @onUndoTask="handleOnUndoTasks"
      @toggleSelectAllTasksInTable="handleSelectAllTasks"
      @onTaskChangePage="fetchData"
    ></TableTasksByDeletedAt>
    <template v-else>
      <TableTasksByProject
        v-for="project in projects"
        :key="'Project-' + project.id"
        :project="project"
        :selectedTasks="selectedTasks"
        :statuses="statuses"
        :priorities="priorities"
        @onOpenDrawer="handleOnOpenDrawer($event)"
        @onCreateTask="handleOnCreateTask($event)"
        @onDeleteTask="handleOnDeleteTask($event)"
        @onSelectTask="handleSelectTask"
        @toggleSelectAllTasksInProduct="handleSelectAllTasksInProduct"
        @toggleSelectAllTasksInTable="handleSelectAllTasksInTable"
      />
      <div v-if="projects.length === 0" class="no-data">
        {{ $t("msg.noRecords") }}
      </div>
    </template>

    <DrawerTask
      ref="drawerTask"
      :isVisible="isDrawerVisible"
      :task="selectedTaskForDetails"
      :projects="allProjects"
      :selectedProjectForTask="selectedProject"
      :assignees="assignees"
      :statuses="statuses"
      :priorities="priorities"
      @onCheckIsCreate="handleAddSubBtn"
      @closed="toggleDrawer(false)"
      @onDeleteTask="handleOnDeleteTask($event)"
      @onSubmit="handleOnUpsertTask($event)"
      @onCreateComment="handleOnCreateComments"
      @onReplyComment="handleOnCreateComments"
      @onDownloadAttachment="handleOnDownloadAttachment"
    />

    <BulkActionToolbar
      v-if="viewType !== 'softDeleted'"
      :selectedTasks="selectedTasks"
      :statuses="statuses"
      @onDeleteBulk="handleDeleteBulk"
      @onUpdateBulk="handleUpdateBulk"
    />
    <template v-else>
      <BulkUndoToolbar :selectedTasks="selectedTasks" @onUndoBulk="handleOnUndoTasks" />
    </template>
  </div>
</template>

<style scoped>
@import "./Task.scss";
</style>
