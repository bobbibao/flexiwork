<script lang="ts">
import ButtonFilterTasks from "./ButtonFilterTasks";
export default ButtonFilterTasks;
</script>

<template>
  <div class="btn-filter-tasks d-flex">
    <div v-if="showFilter" class="d-flex select-group">
      <SelectInput :options="assignees" @onChange="handleOnChangeAssignee($event)" />
      <SelectInput :options="statuses" @onChange="handleOnChangeStatus($event)" :multiple="true" />
      <SelectInput :options="priorities" @onChange="handleOnChangePriority($event)" />
    </div>

    <ButtonCustom :text="$t('task.filters')" variant="secondary-gray" @click="toggleSelectGroup">
      <template #start-icon>
        <FilterLinesIcon />
      </template>
    </ButtonCustom>
  </div>
</template>

<style scoped>
@import "./ButtonFilterTasks.scss";
</style>
