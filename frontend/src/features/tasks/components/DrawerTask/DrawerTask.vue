<!-- eslint-disable max-len -->
<script lang="ts">
import DrawerTask from "./DrawerTask";
export default DrawerTask;
</script>

<template>
  <b-sidebar
    id="sidebar-right"
    ref="sidebar"
    right
    backdrop
    no-close-on-esc
    no-close-on-backdrop
    no-header
    bg-variant="white"
    :visible="isVisible"
  >
    <div class="drawer-header">
      <h6>{{ isSubTask ? $t("task.taskDetail.subTaskTitle") : $t("task.taskDetail.taskTitle") }}</h6>
      <div class="actions">
        <div>
          <button v-if="!task?.parent_task_id" class="btn-add-subtask" @click="handleAddSubtaskBtn">
            <PlusIcon />
            {{ $t("task.taskDetail.addSubTask") }}
          </button>
          <button v-if="task" class="btn-delete" v-b-modal="'Drawer-delete-' + task.id">
            <TrashIcon />
            {{ $t("button.delete") }}
          </button>
          <ConfirmModal
            v-if="task"
            :modal-id="'Drawer-delete-' + task.id"
            :header="$t('title.deleteTask')"
            :body="$t('msg.delTask') + ' \'' + task.name + '\'?'"
            @confirm="!!$event && deleteTask()"
          />
        </div>
        <button class="btn-close" v-b-modal="'drawer-close'" @click="!isChangeForm() && handleCloseModal()">
          <i class="flaticon2-cross"></i>
        </button>

        <ConfirmModal
          v-if="isChangeForm()"
          :modal-id="'drawer-close'"
          :header="$t('title.closeTask')"
          :body="$t('msg.closeTask')"
          @confirm="!!$event && handleCloseModal()"
        />
      </div>
    </div>

    <b-form class="mb-3 task-detail">
      <div class="form-item">
        <label for="project-select"> <i class="fas fa-folder-open"></i> {{ $t("project.project") }} </label>

        <SearchableDropdown
          :options="projects"
          :selectedOption="selectedProject ? selectedProject : {}"
          :searchFunction="searchProject"
          :showSelectedOptionFunction="showSelectedProject"
          :placeholder="$t('task.taskDetail.select')"
          @onSelectOption="handleOnChangeProject"
        >
          <template #option="{ option }">
            <div>
              {{
                option?.number.custom_id
                  ? truncateByWords((option?.number.custom_id || "") + " - " + option.name, 12)
                  : truncateByWords((option?.number.id || "") + " - " + option.name, 12)
              }}
            </div>
          </template>
        </SearchableDropdown>
      </div>
      <div class="form-item">
        <label for="phases-select"> <i class="fas fa-box-open"></i> {{ $t("task.taskDetail.productService") }}</label>
        <SearchableDropdown
          :options="products"
          :selectedOption="selectedProduct ? selectedProduct : {}"
          :searchFunction="searchProduct"
          :showSelectedOptionFunction="showSelectedProduct"
          :placeholder="$t('task.taskDetail.select')"
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

      <div class="form-item" v-if="isSubTask">
        <label for="phase-select"> <i class="fas fa-tasks"></i>{{ $t("menu.task") }} </label>
        <ButtonDropDown
          :title="selectedParentTaskTitle"
          :listData="parentTasks"
          :keyField="'id'"
          :displayField="'name'"
          :onChange="handleChangeParentTask"
        >
          <template #dropdown-item="{ data }">
            <div>
              <span class="ml-2">{{ data.name }}</span>
            </div>
          </template>
        </ButtonDropDown>
      </div>

      <div class="form-item">
        <label for="task-input">
          <i class="fas fa-tasks"></i>{{ isSubTask ? $t("task.taskDetail.subTaskName") : $t("menu.task") }}
        </label>
        <b-form-input
          v-model="form.name"
          :placeholder="isSubTask ? $t('task.taskDetail.subTaskPlaceholder') : $t('task.taskDetail.taskPlaceHolder')"
        />
      </div>

      <div class="form-item">
        <label for="status-select"> <i class="fas fa-clipboard-check"></i> {{ $t("timeOverview.status") }} </label>
        <ButtonDropDown :listData="statuses" :keyField="'id'" :displayField="'label'" :onChange="handleChangeStatus">
          <template #title>
            <div class="label-dropdown" v-if="selectedStatus">
              <TagIcon />
              <SeverityBadge :title="selectedStatus.label" :color="selectedStatus.color" />
            </div>
            <div class="label-dropdown" v-else>
              <TagIcon />
              <span>{{ $t("task.taskDetail.select") }}</span>
            </div>
          </template>
          <template #option="{ data }">
            <SeverityBadge :title="data.label" :color="data.color" />
          </template>
        </ButtonDropDown>
      </div>

      <div class="form-item">
        <label for="priority-select"> <i class="fas fa-flag"></i> {{ $t("task.priority") }} </label>

        <ButtonDropDown
          :listData="priorities"
          :keyField="'id'"
          :displayField="'title'"
          :onChange="handleChangePriority"
        >
          <template #title>
            <div class="label-dropdown" v-if="selectedPriority">
              <TagIcon />
              <SeverityBadge :title="selectedPriority.label" :color="selectedPriority.color" />
            </div>
            <div class="label-dropdown" v-else>
              <TagIcon />
              <span> {{ $t("task.taskDetail.select") }}</span>
            </div>
          </template>
          <template #option="{ data }">
            <SeverityBadge :title="data.label" :color="data.color" />
          </template>
        </ButtonDropDown>
      </div>

      <div class="form-item assignee-input">
        <label for="assignee-select"> <i class="fas fa-user"></i> {{ $t("task.taskDetail.assignTo") }} </label>
        <b-dropdown id="assignee-select" no-caret toggle-class="w-100" auto-close="false">
          <template #button-content>
            <div v-if="selectedAssignees.length > 0" class="label-dropdown">
              <div v-for="assignee in selectedAssignees" :key="assignee.id">
                <div class="user">
                  <Avatar
                    :filePath="assignee.avatar_url"
                    classNames="rounded-circle mr-2"
                    width="32"
                    height="32"
                    placeholder="Avatar"
                  />
                  <span class="name">{{ getAssigneeName(assignee) }}</span>
                </div>
              </div>
            </div>

            <div v-else class="label-dropdown" style="flex-direction: row; align-items: center; padding: 2px 0">
              <UserIcon />
              {{ $t("task.taskDetail.select") }}
            </div>

            <ChevronDownIcon />
          </template>
          <div>
            <div class="search-input-assignees">
              <input
                type="text"
                v-model="searchQuery"
                :placeholder="String($t('task.searchAssignee'))"
                class="form-control"
              />
            </div>

            <div>
              <b-dropdown-item-button
                v-for="assignee in filteredAssignees"
                :key="assignee.id"
                @click="handleChangeAssignees($event, assignee)"
              >
                <div class="dropdown-item" :class="{ 'selected-item': isAssigneeSelected(assignee) }">
                  <div class="user">
                    <Avatar
                      :filePath="assignee.avatar_url"
                      classNames="rounded-circle mr-2"
                      width="32"
                      height="32"
                      placeholder="Avatar"
                    />
                    <span class="name">{{ getAssigneeName(assignee) }}</span>
                  </div>

                  <template v-if="isAssigneeSelected(assignee)">
                    <CheckIcon />
                  </template>
                </div>
              </b-dropdown-item-button>
            </div>
          </div>
        </b-dropdown>
      </div>

      <div class="form-item">
        <label for="due-date-input"> <i class="fas fa-calendar-alt"></i> {{ $t("task.taskDetail.dueDate") }} </label>
        <b-form-datepicker id="due-date-input" v-model="form.due_date" :start-weekday="1"></b-form-datepicker>
      </div>

      <div class="form-item">
        <label for="input-data-input"> <i class="fas fa-upload"></i> {{ $t("task.taskDetail.inputData") }} </label>
        <b-form-input
          id="input-data-input"
          v-model="form.input_data"
          :placeholder="$t('task.taskDetail.enterInputData')"
        >
        </b-form-input>
      </div>

      <div class="form-item">
        <label for="output-data-input"> <i class="fas fa-download"></i> {{ $t("task.taskDetail.outputData") }} </label>
        <b-form-input
          id="output-data-input"
          v-model="form.output_data"
          :placeholder="$t('task.taskDetail.enterOutputData')"
        >
        </b-form-input>
      </div>

      <div class="tabs-container">
        <div class="tabs">
          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'description' }"
            @click="selectTab('description')"
          >
            {{ $t("product.desc") }}
          </button>
          <button
            type="button"
            v-if="task"
            class="tab"
            :class="{ active: activeTab === 'comments' }"
            @click="selectTab('comments')"
          >
            {{ $t("address.comments") }} <span class="count">{{ task.comments.length }}</span>
          </button>
        </div>

        <div class="tab-content">
          <div v-if="activeTab === 'description'" class="tab-pane active">
            <ContentEditor v-model="form.description" :placeholder="$t('offer.enterDescription')" />
          </div>

          <div v-if="activeTab === 'comments'" class="tab-pane active comments-section">
            <div class="comment-input">
              <textarea v-model="newComment" :placeholder="String($t('offer.enterDescription'))"></textarea>
              <FileUpload
                :id="'comment-attachments'"
                :files="files"
                @update:files="updateFiles"
                class="comment-files"
              />
              <b-button class="comment-submit" :disabled="!newCommentHasContent" @click="createComment()">
                <SendIcon />
              </b-button>
            </div>
            <div v-if="attachments.length > 0" class="selected-files mt-2">
              <ul>
                <li v-for="(attach, index) in attachments" :key="index">
                  <div>
                    <i :class="getFileIconClass(attach.filename)" :style="getFileIconColor(attach.filename)"></i>
                    <span>{{ attach.filename }}</span>
                  </div>
                  <button class="btn-remove-files" type="button" @click="removeFile(index, false)">
                    <strong>x</strong>
                  </button>
                </li>
              </ul>
            </div>

            <div v-if="task.comments.length > 0" class="comments-list">
              <div v-for="comment in task.comments" :key="'Comment-' + comment.id" class="comment">
                <div class="comment-header">
                  <Avatar :filePath="comment.user.avatar_url" classNames="rounded-circle mr-1" width="32" height="32" />
                  <span class="comment-author">{{ comment.user.first_name }} {{ comment.user.last_name }}</span>
                  <span class="comment-time">{{ timeAgo(comment.created_at) }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <div v-if="comment.attachments.length > 0" class="selected-files mt-2">
                  <div v-for="(attachment, index) in comment.attachments" :key="index">
                    <button type="button" @click="handleDownload(attachment.id)">
                      <i
                        :class="getFileIconClass(attachment.filename)"
                        :style="getFileIconColor(attachment.filename)"
                      ></i>
                      {{ attachment.filename }}
                    </button>
                  </div>
                </div>

                <b-button @click="handleClickReplyButton(comment.id)" class="reply-button">{{
                  $t("button.reply")
                }}</b-button>
                <div v-if="selectedCommentIdToReply === comment.id" class="reply-input">
                  <textarea v-model="replyComment" placeholder="Enter a description..."></textarea>
                  <FileUpload
                    :id="'reply-attachments-' + comment.id"
                    :files="replyFiles[comment.id] || []"
                    @update:files="files => updateReplyFiles(comment.id, files)"
                    class="reply-files"
                  />
                  <b-button class="reply-submit" @click="handleReplyComment(comment.id)">
                    <SendIcon />
                  </b-button>
                </div>
                <div
                  v-if="replyAttachments[comment.id] && replyAttachments[comment.id].length > 0"
                  class="selected-files mt-2"
                >
                  <ul>
                    <li v-for="(attach, index) in replyAttachments[comment.id]" :key="index">
                      <i :class="getFileIconClass(attach.filename)" :style="getFileIconColor(attach.filename)"></i>
                      <span>{{ attach.filename }}</span>
                      <button class="btn-remove-files" type="button" @click="removeFile(index, true, comment.id)">
                        <strong>x</strong>
                      </button>
                    </li>
                  </ul>
                </div>

                <div v-for="reply in comment.replies" :key="'Reply-' + reply.id" class="reply ml-6 mt-4">
                  <div class="reply-header">
                    <Avatar :filePath="reply.user.avatar_url" classNames="rounded-circle mr-1" width="32" height="32" />
                    <span class="reply-author">{{ reply.user.first_name }} {{ reply.user.last_name }}</span>
                    <span class="reply-time">{{ timeAgo(reply.created_at) }}</span>
                  </div>
                  <p class="reply-text">{{ reply.content }}</p>
                  <div v-if="reply.attachments.length > 0" class="selected-files mt-2">
                    <div v-for="(rp, index) in reply.attachments" :key="index">
                      <button type="button" @click="handleDownload(rp.id)">
                        <i :class="getFileIconClass(rp.filename)" :style="getFileIconColor(rp.filename)"></i>
                        {{ rp.filename }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-drawer">
        <b-button class="save-button" :disabled="isSaving" @click="submit()">
          <template v-if="isSaving">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            {{ task ? $t("button.saving") : $t("button.creating") }}
          </template>
          <template v-else>
            {{ task ? $t("button.save") : $t("button.create") }}
          </template>
        </b-button>
      </div>
    </b-form>
  </b-sidebar>
</template>

<style scoped>
@import "./DrawerTask.scss";
</style>
