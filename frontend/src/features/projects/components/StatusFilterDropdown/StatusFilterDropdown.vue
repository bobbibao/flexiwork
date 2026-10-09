<script lang="ts">
import ButtonFilterTasks from "./StatusFilterDropdown";
export default ButtonFilterTasks;
</script>

<template>
  <div class="btn-filter-tasks d-flex">
    <div class="d-flex select-group">
      <SelectInput :options="statuses" @onChange="handleOnChangeStatus($event)" />
    </div>
  </div>
</template>

<style scoped>
@import "./StatusFilterDropdown.scss";
</style>
