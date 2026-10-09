<script lang="ts">
import TableTasksByProject from "./TableTasksByProject";
export default TableTasksByProject;
</script>

<template>
  <div v-if="sortSubTasks.products.length > 0">
    <div class="px-8 py-4 d-flex justify-content-between align-items-center bg-gray-200">
      <div class="d-flex align-items-center gap-3">
        <ButtonCustom size="sm" variant="secondary-gray" @click="toggleTable()">
          <template #start-icon>
            <ChevronUpIcon :isExpanded="!isExpanded" />
          </template>
        </ButtonCustom>
        <h6 class="m-0 font-weight-bolder text-dark">
          {{ (project?.number && project.number?.custom_id ? project.number.custom_id + " - " : project.number_id + " - ") + project.name }}
          <span class="text-gray-400 ml-1">{{ getTotalTasks }}</span>
        </h6>
      </div>

      <ButtonCustom size="sm" variant="link-gray" @click="createTask()">
        <template #start-icon>
          <PlusIcon />
        </template>
      </ButtonCustom>
    </div>

    <table
      ref="tableTasks"
      class="table archapp-table-project archapp-table-striped d-block overflow-auto"
      :class="{ open: isExpanded }"
      :style="{ maxHeight: isExpanded ? tableHeight + 'px' : '0px' }"
    >
      <thead>
        <tr class="cursor-pointer">
          <th>
            <b-form-checkbox
              class="visible-box"
              size="lg"
              @change="toggleSelectAllTasksInTable($event, project)"
              :checked="areAllTasksInTableSelected()"
            ></b-form-checkbox>
          </th>
          <th @click="handleSort('name')">
            {{ $t("task.taskName") }}
            <SortIcon :currentOrder="order" orderField="name" />
          </th>
          <th @click="handleSort('status_id')">
            Status
            <SortIcon :currentOrder="order" orderField="status_id" />
          </th>
          <th @click="handleSort('description')">
            {{ $t("product.desc") }}
            <SortIcon :currentOrder="order" orderField="description" />
          </th>
          <th>{{ $t("task.taskDetail.productService") }}</th>
          <th @click="handleSort('due_date')">
            {{ $t("task.taskDetail.dueDate") }}
            <SortIcon :currentOrder="order" orderField="due_date" />
          </th>
          <th @click="handleSort('priority_id')">
            {{ $t("task.priority") }}
            <SortIcon :currentOrder="order" orderField="priority_id" />
          </th>
          <th>{{ $t("task.taskDetail.assignTo") }}</th>
          <th @click="handleSort('input_data')">
            {{ $t("task.taskDetail.inputData") }}
            <SortIcon :currentOrder="order" orderField="input_data" />
          </th>
          <th @click="handleSort('output_data')">
            {{ $t("task.taskDetail.outputData") }}
            <SortIcon :currentOrder="order" orderField="output_data" />
          </th>
          <th @click="handleSort('created_by')">
            {{ $t("task.createdBy") }} <SortIcon :currentOrder="order" orderField="created_by" />
          </th>
          <th @click="handleSort('created_at')">
            {{ $t("task.createdAt") }}
            <SortIcon :currentOrder="order" orderField="created_at" />
          </th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <template v-for="(prod, index) in sortSubTasks.products">
          <tr v-bind:key="'product-' + (prod.id + index)">
            <td class="py-4 d-flex align-items-center">
              <b-form-checkbox
                class="visible-box"
                size="lg"
                @change="toggleSelectAllTasksInProduct($event, prod.id)"
                :checked="areAllTasksSelected(prod.id)"
              ></b-form-checkbox>
              <ButtonCustom custom-class="ml-4" size="sm" variant="secondary-gray" @click="toggleProduct(prod.id)">
                <template #start-icon>
                  <ChevronUpIcon :isExpanded="isExpandedProduct(prod.id)" />
                </template>
              </ButtonCustom>
            </td>

            <td class="font-weight-bolder text-lg text-dark py-4" colspan="12">
              {{ prod.name }}
            </td>
          </tr>
          <template v-if="!isExpandedProduct(prod.id)">
            <template v-for="task in prod.tasks">
              <tr
                class="cursor-pointer"
                :key="'Task-' + (task.project_id + '-' + task.product_id + '-' + task.id)"
                @click="openDrawer($event, task)"
              >
                <td class="py-6">
                  <b-form-checkbox
                    class="visible-box"
                    size="lg"
                    @change="onSelectTask($event, task)"
                    :checked="selectedTasks.includes(task.id)"
                  ></b-form-checkbox>
                </td>
                <td class="space-x-2 font-weight-bold text-dark py-6">
                  <i class="mr-2">
                    <ArrowReturnRight />
                  </i>
                  <span
                    data-toggle="tooltip"
                    v-html="truncateByWords(task.name || '', 10)"
                    v-b-tooltip.hover.html.top="countWordsInText(task.name || '') > 10 ? task.name : ''"
                  ></span>
                </td>
                <td class="py-6">
                  <SeverityBadge
                    :title="getTaskState(statuses, task.status_id)?.label"
                    :color="getTaskState(statuses, task.status_id)?.color"
                  />
                </td>
                <td class="text-gray-600 py-6">
                  <span
                    data-toggle="tooltip"
                    v-html="truncateByWords(task.description || '', 10)"
                    v-b-tooltip.hover.html.top="countWordsInText(task.description || '') > 10 ? task.description : ''"
                  ></span>
                </td>
                <td class="text-gray-600 py-6">{{ prod.name }}</td>
                <td class="text-gray-600 py-6">
                  <template v-if="task.due_date">
                    {{ formatDate(task.due_date, "DD.MM.YYYY") }}
                  </template>
                </td>
                <td class="py-6">
                  <SeverityBadge
                    :title="getTaskState(priorities, task.priority_id)?.label"
                    :color="getTaskState(priorities, task.priority_id)?.color"
                  />
                </td>
                <td class="text-gray-600 py-6">
                  <AssigneeAvatars :assignees="task.task_assignees"></AssigneeAvatars>
                </td>
                <td class="text-gray-600 py-6">
                  {{ task.input_data }}
                </td>
                <td class="text-gray-600 py-6">
                  {{ task.output_data }}
                </td>
                <td class="text-gray-600 py-6">
                  <Avatar
                    :filePath="task.creator.avatar_url"
                    classNames="rounded-circle border-2 border-white mr-2"
                    width="30"
                    height="30"
                  />
                  {{ getAssigneeName(task.creator) }}
                </td>
                <td class="text-gray-600 py-6">
                  <template v-if="task.created_at">
                    {{ formatDate(task.created_at, "DD.MM.YYYY hh:mm A") }}
                  </template>
                </td>
                <td class="py-6">
                  <button type="button" v-b-modal="'Delete-' + task.id">
                    <TrashDetailedIcon />
                  </button>
                  <ConfirmModal
                    :modal-id="'Delete-' + task.id"
                    :header="$t('title.deleteTask')"
                    :body="$t('msg.delTask') + ' \'' + task.name + '\'?'"
                    @confirm="!!$event && deleteTask(task.id)"
                  />
                </td>
              </tr>

              <tr
                class="cursor-pointer"
                v-for="(subTask, index) in task.sub_tasks"
                :key="'SubTask-' + subTask.id + '-' + index"
                @click="openDrawer($event, subTask)"
              >
                <td class="py-6">
                  <b-form-checkbox
                    class="visible-box"
                    size="lg"
                    @change="onSelectTask($event, subTask)"
                    :checked="selectedTasks.includes(subTask.id)"
                  ></b-form-checkbox>
                </td>
                <td class="sub-task space-x-2 font-weight-bold text-dark py-6">
                  <i class="mr-2">
                    <ArrowReturnRight />
                  </i>
                  {{ subTask.name }}
                </td>
                <td class="py-6">
                  <SeverityBadge
                    :title="getTaskState(statuses, subTask.status_id)?.label"
                    :color="getTaskState(statuses, subTask.status_id)?.color"
                  />
                </td>
                <td class="text-gray-600 py-6">
                  <span
                    data-toggle="tooltip"
                    v-html="truncateByWords(subTask.description || '', 10)"
                    v-b-tooltip.hover.html.top="
                      countWordsInText(subTask.description || '') > 10 ? subTask.description : ''
                    "
                  ></span>
                </td>
                <td class="text-gray-600 py-6">{{ prod.name }}</td>
                <td class="text-gray-600 py-6">
                  <template v-if="subTask.due_date">
                    {{ formatDate(subTask.due_date, "DD.MM.YYYY") }}
                  </template>
                </td>
                <td class="py-6">
                  <SeverityBadge
                    :title="getTaskState(priorities, subTask.priority_id)?.label"
                    :color="getTaskState(priorities, subTask.priority_id)?.color"
                  />
                </td>
                <td class="text-gray-600 py-6">
                  <AssigneeAvatars :assignees="subTask.task_assignees"></AssigneeAvatars>
                </td>
                <td class="text-gray-600 py-6">
                  {{ subTask.input_data }}
                </td>
                <td class="text-gray-600 py-6">
                  {{ subTask.output_data }}
                </td>
                <td class="text-gray-600 py-6">
                  <Avatar
                    :filePath="subTask.creator.avatar_url"
                    classNames="rounded-circle border-2 border-white mr-2"
                    width="30"
                    height="30"
                  />
                  {{ getAssigneeName(subTask.creator) }}
                </td>
                <td class="text-gray-600 py-6">
                  <template v-if="subTask.created_at">
                    {{ formatDate(subTask.created_at, "DD.MM.YYYY hh:mm A") }}
                  </template>
                </td>
                <td class="py-6">
                  <button type="button" v-b-modal="'Delete-' + subTask.id">
                    <TrashDetailedIcon />
                  </button>
                  <ConfirmModal
                    :modal-id="'Delete-' + subTask.id"
                    :header="$t('title.deleteTask')"
                    :body="$t('msg.delTask') + ' \'' + subTask.name + '\'?'"
                    @confirm="!!$event && deleteTask(subTask.id)"
                  />
                </td>
              </tr>
            </template>
          </template>
        </template>

        <tr>
          <td class="font-weight-bolder text-dark py-4 bg-white" colspan="13">
            <button
              class="d-flex justify-content-center align-items-center gap-2 !text-gray-600"
              type="button"
              @click="createTask()"
            >
              <PlusIcon width="12" height="12" />
              {{ $t("task.addTask") }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
@import "./TableTasksByProject.scss";
</style>
