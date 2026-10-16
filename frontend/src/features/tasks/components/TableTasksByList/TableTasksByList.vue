<script lang="ts">
import TableTasksByList from "./TableTasksByList";
export default TableTasksByList;
</script>

<template>
  <div class="table-tasks-by-list m-0">
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

      <template #head(priority)="data">
        <div class="cursor-pointer" @click="handleSort('priority_id')">
          {{ $t("task.priority") }}
          <SortIcon :currentOrder="sortOrder" orderField="priority_id" />
        </div>
      </template>

      <template #head(dueDate)="data">
        <div class="cursor-pointer" @click="handleSort('due_date')">
          {{ $t("task.taskDetail.dueDate") }}
          <SortIcon :currentOrder="sortOrder" orderField="due_date" />
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

      <template #cell(createdBy)="data">
        <div class="flexiwork-table__col-createdby">
          <Avatar
            class-names="rounded-circle border-2 border-white"
            :file-path="data.item.createdBy.avatar_url"
            width="32"
            height="32"
          />
          <p>
            {{ data.item.createdBy.first_name + " " + data.item.createdBy.last_name }}
          </p>
        </div>
      </template>

      <template #cell(createdTime)="data">
        {{ formatDate(data.item.createdTime, "DD.MM.YYYY hh:mm A") }}
      </template>

      <template #cell(actions)="data">
        <div class="flexiwork-table__col-actions">
          <ButtonCustom variant="link-gray" v-b-modal="'Delete-' + data.item.id">
            <template #start-icon>
              <TrashDetailedIcon />
              <ConfirmModal
                :modal-id="'Delete-' + data.item.id"
                :header="$t('title.deleteTask')"
                :body="$t('msg.delTask') + ' \'' + data.item.taskName + '\'?'"
                @confirm="!!$event && deleteTask(data.item.id)"
              />
            </template>
          </ButtonCustom>
        </div>
      </template>
    </TableDefault>
  </div>
</template>

<style scoped>
@import "./TableTasksByList.scss";
</style>
