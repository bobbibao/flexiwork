<script lang="ts">
import TableTasksByList from "./TableTasksByDeletedAt";
export default TableTasksByList;
</script>

<template>
  <div class="table-tasks-by-deleted-at m-0">
    <TableDefault
      ref="tableDefault"
      selectable
      select-mode="single"
      :data="listTasks"
      :fields="fields"
      :pagination="pagination"
      :isLoading="fetchingData"
      @rowSelected="openDrawer"
      @onChangePage="handleChangePage"
    >
      <!-- Header -->
      <template #head(checkBox)="data">
        <b-form-checkbox
          :checked="areAllTasksInTableSelected()"
          @change="handleAllRowSelected($event)"
          class="visible-box"
          size="lg"
        ></b-form-checkbox>
      </template>

      <template #head(project)="data">
        <div class="cursor-pointer" @click="handleSort('project')">
          {{ $t("project.project") }}
          <SortIcon :currentOrder="sortOrder" orderField="project" />
        </div>
      </template>

      <template #head(taskName)="data">
        <div class="cursor-pointer" @click="handleSort('name')">
          {{ $t("task.taskName") }}
          <SortIcon :currentOrder="sortOrder" orderField="name" />
        </div>
      </template>

      <template #head(status)="data">
        <div class="cursor-pointer" @click="handleSort('status_id')">
          Status
          <SortIcon :currentOrder="sortOrder" orderField="status_id" />
        </div>
      </template>

      <template #head(description)="data">
        <div class="cursor-pointer" @click="handleSort('description')">
          {{ $t("product.desc") }}
          <SortIcon :currentOrder="sortOrder" orderField="description" />
        </div>
      </template>

      <template #head(priority)="data">
        <div class="cursor-pointer" @click="handleSort('priority_id')">
          {{ $t("settings.product") }}
          <SortIcon :currentOrder="sortOrder" orderField="priority_id" />
        </div>
      </template>

      <template #head(dueDate)="data">
        <div class="cursor-pointer" @click="handleSort('due_date')">
          {{ $t("task.taskDetail.dueDate") }}
          <SortIcon :currentOrder="sortOrder" orderField="due_date" />
        </div>
      </template>

      <template #head(product)="data">
        <div>
          {{ $t("settings.product") }}
        </div>
      </template>

      <template #head(assignees)="data">
        <div>
          {{ $t("task.taskDetail.assignTo") }}
        </div>
      </template>

      <template #head(inputData)="data">
        <div>
          {{ $t("task.taskDetail.inputData") }}
        </div>
      </template>

      <template #head(outputData)="data">
        <div>
          {{ $t("task.taskDetail.outputData") }}
        </div>
      </template>

      <template #head(createdBy)="data">
        <div>
          {{ $t("task.createdBy") }}
        </div>
      </template>

      <template #head(deletedBy)="data">
        <div>
          {{ $t("task.deletedBy") }}
        </div>
      </template>

      <template #head(deletedTime)="data">
        <div>
          {{ $t("task.deletedAt") }}
        </div>
      </template>

      <template #head(createdTime)="data">
        <div class="cursor-pointer" @click="handleSort('created_at')">
          {{ $t("task.createdAt") }}
          <SortIcon :currentOrder="sortOrder" orderField="created_at" />
        </div>
      </template>

      <!-- Body -->
      <template #cell(checkBox)="data">
        <b-form-checkbox
          :checked="selectedTasks.includes(data.item.id)"
          class="visible-box"
          size="lg"
          @change="handleSelectRow($event, data.item.id)"
        ></b-form-checkbox>
      </template>

      <template #cell(project)="data">
        <p class="row-bold">{{ data.item.project }}</p>
      </template>

      <template #cell(status)="data">
        <SeverityBadge :title="data.item.status.title" :color="data.item.status.color" />
      </template>

      <template #cell(description)="data">
        <div
          data-toggle="tooltip"
          v-html="truncateByLength(data.item.description, 20)"
          v-b-tooltip.hover.html.top="(data.item.description || '').length > 20 ? data.item.description : ''"
        ></div>
      </template>

      <template #cell(dueDate)="data">
        {{ formatDate(data.item.dueDate, "DD.MM.YYYY") }}
      </template>

      <template #cell(priority)="data">
        <SeverityBadge :title="data.item.priority.title" :color="data.item.priority.color" />
      </template>

      <template #cell(assignees)="data">
        <AssigneeAvatars :assignees="data.item.assignees" />
      </template>

      <template #cell(deletedBy)="data">
        <div class="flexiwork-table__col-createdby">
          <Avatar
            class-names="rounded-circle border-2 border-white"
            :file-path="data.item.deletedBy.avatar_url"
            width="32"
            height="32"
          />
          <p>
            {{ data.item.deletedBy.first_name + " " + data.item.deletedBy.last_name }}
          </p>
        </div>
      </template>

      <template #cell(deletedTime)="data">
        {{ formatDate(data.item.deletedTime, "DD.MM.YYYY hh:mm A") }}
      </template>

      <template #cell(actions)="data">
        <div class="flexiwork-table__col-actions">
          <ButtonCustom variant="link-gray" v-b-modal="'Undo-' + data.item.id">
            <template #start-icon>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.12988 18.31H15.1299C17.8899 18.31 20.1299 16.07 20.1299 13.31C20.1299 10.55 17.8899 8.31 15.1299 8.31H4.12988"
                  stroke="#181632"
                  stroke-width="1.5"
                  stroke-miterlimit="10"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M6.43012 10.81L3.87012 8.25L6.43012 5.69"
                  stroke="#181632"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <ConfirmModal
                :modal-id="'Undo-' + data.item.id"
                :header="$t('title.undoTask')"
                :body="$t('msg.undoTask', { taskName: data.item.taskName })"
                @confirm="!!$event && handleUndoTask(parseInt(data.item.id))"
                :confirmButtonLabel="'Undo'"
              />
            </template>
          </ButtonCustom>
        </div>
      </template>
    </TableDefault>
  </div>
</template>

<style scoped>
@import "./TableTasksByDeletedAt.scss";
</style>
