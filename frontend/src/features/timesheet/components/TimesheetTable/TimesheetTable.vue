<script lang="ts">
import TimesheetTable from "./TimesheetTable";
export default TimesheetTable;
</script>

<template>
  <div class="timesheet-table-wrapper">
    <div class="timesheet-content">
      <div class="table-responsive">
        <table class="table">
          <!-- Main Header -->
          <thead class="main-header">
            <tr class="cursor-pointer">
              <th @click="handleSort('name')">Service <SortIcon :currentOrder="order" orderField="name" /></th>
              <template :key="index" v-for="(header, index) in dateHeaders">
                <th
                  :class="{
                    'vertical-border-start': index === 0,
                    'vertical-border-end': index === dateHeaders.length - 1,
                    weekend: header.date.getDay() === 0 || header.date.getDay() === 6,
                    today: isToday(header.date),
                    holiday: isHoliday(header.date)
                  }"
                  v-b-tooltip.hover.html.top="isHoliday(header.date)?.label"
                >
                  {{ header.label }}
                </th>
              </template>

              <th @click="handleSort('output_data')">
                {{ $t("timesheet.total") }}
                <SortIcon :currentOrder="order" orderField="output_data" />
              </th>
            </tr>
          </thead>

          <tbody>
            <template v-for="project in sortSubTasks">
              <!-- Project List -->
              <tr v-if="project.products.length > 0" :key="'header-' + project.id" class="project-header">
                <td class="p-0">
                  <div class="px-2 py-2 d-flex justify-content-between align-items-center bg-gray-200">
                    <div class="d-flex align-items-center gap-2">
                      <ButtonCustom size="sm" variant="secondary-gray" @click="toggleTable(project.id)">
                        <template #start-icon>
                          <ChevronUpIcon :isExpanded="!isProjectExpanded(project.id)" />
                        </template>
                      </ButtonCustom>
                      <div class="m-0 font-weight-bolder text-dark">
                        <span
                          :title="(project?.number?.custom_id ? project.number.custom_id + ' - ' : '') + project.name"
                        >
                          {{ (project?.number?.custom_id ? project.number.custom_id + " - " : "") + project.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td v-for="(header, index) in dateHeaders" :key="index" class="bg-gray-200">
                  {{
                    getProjectTotals(project.id)[header.date.toISOString()] > 0
                      ? getProjectTotals(project.id)[header.date.toISOString()].toFixed(2) + "h"
                      : ""
                  }}
                </td>
                <!-- Total column -->
                <td class="text-sm bg-gray-200">{{ getProjectTotals(project.id).total.toFixed(2) }}h</td>
              </tr>

              <template v-if="isProjectExpanded(project.id)">
                <template :key="'product-' + prod.id + '-' + project.id" v-for="prod in project.products">
                  <!-- Product List - Now editable -->
                  <tr>
                    <td class="font-weight-bolder text-dark py-2 bg-gray-100">
                      <span class="" :title="prod.name">{{ prod.name }}</span>
                    </td>
                    <!-- Editable cells for product instead of calculated totals -->
                    <template :key="index" v-for="(header, index) in dateHeaders">
                      <td
                        class="py-0 bg-gray-100"
                        :class="{
                          'vertical-border-start': index === 0,
                          'vertical-border-end': index === dateHeaders.length - 1,
                          weekend: header.date.getDay() === 0 || header.date.getDay() === 6,
                          holiday: isHoliday(header.date),
                          'has-comment': hasComment(
                            `product-${prod.id}`,
                            formatDate(header.date, 'YYYY-MM-DD'),
                            project.id,
                            prod.id
                          )
                        }"
                        v-b-tooltip.hover.html.top="
                          getTaskComment(
                            `product-${prod.id}`,
                            formatDate(header.date, 'YYYY-MM-DD'),
                            project.id,
                            prod.id
                          )
                        "
                        @dblclick="
                          openCommentDialog(
                            `product-${prod.id}`,
                            formatDate(header.date, 'YYYY-MM-DD'),
                            project.id,
                            prod.id
                          )
                        "
                      >
                        <EditableCell
                          :value="
                            getTaskHours(
                              `product-${prod.id}`,
                              formatDate(header.date, 'YYYY-MM-DD'),
                              project.id,
                              prod.id
                            )
                          "
                          :comment="
                            getTaskComment(
                              `product-${prod.id}`,
                              formatDate(header.date, 'YYYY-MM-DD'),
                              project.id,
                              prod.id
                            )
                          "
                          :onSave="
                            val =>
                              saveOrCreateTaskHour(
                                `product-${prod.id}`,
                                formatDate(header.date, 'YYYY-MM-DD'),
                                val,
                                getTaskComment(
                                  `product-${prod.id}`,
                                  formatDate(header.date, 'YYYY-MM-DD'),
                                  project.id,
                                  prod.id
                                ),
                                project.id,
                                prod.id
                              )
                          "
                          :onComment="
                            () =>
                              openCommentDialog(
                                `product-${prod.id}`,
                                formatDate(header.date, 'YYYY-MM-DD'),
                                project.id,
                                prod.id
                              )
                          "
                          :hasComment="
                            hasComment(`product-${prod.id}`, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                          "
                        />
                      </td>
                    </template>
                    <!-- Total column for product -->
                    <td class="text-sm bg-gray-100">{{ getProductTotals(prod.id).total.toFixed(2) }}h</td>
                  </tr>

                  <!-- Tasks remain as they were -->
                  <template>
                    <!-- Timesheet Content -->
                    <template :key="generateRowKey(project.id, prod.id, task.id)" v-for="task in prod.tasks">
                      <tr
                        :class="{ 'has-subtasks': task.sub_tasks?.length }"
                      >
                        <td class="space-x-2 font-weight-bold text-dark py-2">
                          <i class="mr-1">
                            <ArrowReturnRight />
                          </i>
                          <span
                            data-toggle="tooltip"
                            v-html="truncateByWords(task.name || '', 10)"
                            v-b-tooltip.hover.html.top="countWordsInText(task.name || '') > 10 ? task.name : ''"
                          ></span>
                        </td>
                        <template :key="index" v-for="(header, index) in dateHeaders">
                          <td
                            class="py-0"
                            :class="{
                              'vertical-border-start': index === 0,
                              'vertical-border-end': index === dateHeaders.length - 1,
                              weekend: header.date.getDay() === 0 || header.date.getDay() === 6,
                              holiday: isHoliday(header.date),
                              'has-comment': hasComment(
                                task.id,
                                formatDate(header.date, 'YYYY-MM-DD'),
                                project.id,
                                prod.id
                              )
                            }"
                            v-b-tooltip.hover.html.top="
                              getTaskComment(task.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                            "
                            @dblclick="
                              openCommentDialog(task.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                            "
                          >
                            <EditableCell
                              v-if="!task.sub_tasks?.length"
                              :value="getTaskHours(task.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)"
                              :comment="
                                getTaskComment(task.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                              "
                              :onSave="
                                val =>
                                  saveOrCreateTaskHour(
                                    task.id,
                                    formatDate(header.date, 'YYYY-MM-DD'),
                                    val,
                                    getTaskComment(task.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id),
                                    project.id,
                                    prod.id
                                  )
                              "
                              :onComment="
                                () =>
                                  openCommentDialog(task.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                              "
                              :hasComment="
                                hasComment(task.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                              "
                            />
                            <span v-else class="hour-text">
                              {{ getTaskTotalForDate(task, formatDate(header.date, "YYYY-MM-DD")).toFixed(2) }}h
                            </span>
                          </td>
                        </template>

                        <td class="text-sm text-gray-600 font-weight-bolder py-2">
                          {{ getTaskTotal(task.id).toFixed(2) }}h
                        </td>
                      </tr>

                      <!-- sub-task section -->
                      <tr
                        v-for="subTask in task.sub_tasks"
                        :key="generateRowKey(project.id, prod.id, subTask.id)"
                        class="subtask-row"
                      >
                        <td class="sub-task space-x-2 font-weight-bold text-dark py-2">
                          <span class="subtask-indent"></span>
                          <i class="mr-1">
                            <ArrowReturnRight />
                          </i>
                          {{ subTask.name }}
                        </td>
                        <!-- Dynamic date cells for subtasks -->
                        <template :key="index" v-for="(header, index) in dateHeaders">
                          <td
                            class="py-0 text-gray-600"
                            :class="{
                              'vertical-border-start': index === 0,
                              'vertical-border-end': index === dateHeaders.length - 1,
                              weekend: header.date.getDay() === 0 || header.date.getDay() === 6,
                              holiday: isHoliday(header.date),
                              'has-comment': hasComment(
                                subTask.id,
                                formatDate(header.date, 'YYYY-MM-DD'),
                                project.id,
                                prod.id
                              )
                            }"
                            v-b-tooltip.hover.html.top="
                              getTaskComment(subTask.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                            "
                            @dblclick="
                              openCommentDialog(subTask.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                            "
                          >
                            <EditableCell
                              :value="
                                getTaskHours(subTask.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                              "
                              :comment="
                                getTaskComment(subTask.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                              "
                              :onSave="
                                val =>
                                  saveOrCreateTaskHour(
                                    subTask.id,
                                    formatDate(header.date, 'YYYY-MM-DD'),
                                    val,
                                    getTaskComment(
                                      subTask.id,
                                      formatDate(header.date, 'YYYY-MM-DD'),
                                      project.id,
                                      prod.id
                                    ),
                                    project.id,
                                    prod.id
                                  )
                              "
                              :onComment="
                                () =>
                                  openCommentDialog(
                                    subTask.id,
                                    formatDate(header.date, 'YYYY-MM-DD'),
                                    project.id,
                                    prod.id
                                  )
                              "
                              :hasComment="
                                hasComment(subTask.id, formatDate(header.date, 'YYYY-MM-DD'), project.id, prod.id)
                              "
                            />
                          </td>
                        </template>

                        <td class="text-sm text-gray-600 font-weight-bolder py-2">
                          {{ getTaskTotal(subTask.id).toFixed(2) }}h
                        </td>
                      </tr>
                    </template>
                  </template>
                </template>
              </template>
            </template>
          </tbody>
        </table>
        <table class="table table-summary">
          <tbody>
            <tr v-for="(summary, index) in summaryData" :key="index">
              <td class="font-weight-bold bg-gray-200">
                <SeverityBadge :title="$t(summary)" :color="getSummaryColor(summary)" :showDot="true" />
              </td>
              <template :key="dateIndex" v-for="(header, dateIndex) in dateHeaders">
                <td
                  :class="{
                    'vertical-border-start': dateIndex === 0,
                    'vertical-border-end': dateIndex === dateHeaders.length - 1,
                    weekend: header.date.getDay() === 0 || header.date.getDay() === 6,
                    holiday: isHoliday(header.date),
                    'bg-gray-200': true
                  }"
                  :style="
                    summary === SUMMARY_KEYS.DIFFERENT || summary === SUMMARY_KEYS.FLEXIBLE_HOURS
                      ? { color: getDifferentColor(getSummaryValue(summary, header.date)) }
                      : {}
                  "
                >
                  {{ getSummaryValue(summary, header.date).toFixed(2) }}h
                </td>
              </template>
              <td
                class="font-weight-bolder bg-gray-200"
                :style="
                  summary === SUMMARY_KEYS.DIFFERENT || summary === SUMMARY_KEYS.FLEXIBLE_HOURS
                    ? { color: getDifferentColor(getSummaryValue(summary)) }
                    : {}
                "
              >
                {{ summary === SUMMARY_KEYS.FLEXIBLE_HOURS ? "" : getSummaryValue(summary).toFixed(2) + "h" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "./TimesheetTable.scss";
</style>
