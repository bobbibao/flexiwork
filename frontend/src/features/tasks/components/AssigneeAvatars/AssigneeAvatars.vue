<script lang="ts">
import AssigneeAvatars from './AssigneeAvatars';
export default AssigneeAvatars;
</script>

<template>
  <div class="assignee-avatars">
    <Avatar
      v-for="(assignee) in displayedAssignees()"
      :key="'AssigneeAvatar-' + assignee.user_id"
      :filePath="assignee.user.avatar_url"
      :classNames="'rounded-circle border-2 border-white '"
      width="32"
      height="32"
      data-toggle="tooltip"
      v-b-tooltip.hover.top="getAssigneeName(assignee.user)"
    />
    <div
      v-if="assignees.length > 4"
      class="more-assignees border-2 border-white d-inline-block rounded-circle -ml-3 text-center"
    >
      +{{ assignees.length - 3 }}
    </div>
    <span v-if="assignees.length === 1" class="ml-2">{{ getAssigneeName(assignees[0].user) }}</span>
  </div>
</template>

<style scoped>
@import "./AssigneeAvatars.scss";
</style>
