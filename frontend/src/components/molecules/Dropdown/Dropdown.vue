<script lang="ts">
import Dropdown from "./Dropdown";
export default Dropdown;
</script>

<template>
  <div class="btn-filter-tasks d-flex">
    <div class="d-flex select-group">
      <SelectInput :options="options" @onChange="handleOnChangeOptions($event)" />
    </div>
  </div>
</template>

<style scoped>
@import "./Dropdown.scss";
</style>
