<script lang="ts">
import SearchInput from "./SearchInput";
export default SearchInput;
</script>

<template>
  <div class="position-relative">
    <input
      ref="searchInput"
      class="form-control form-control-2 pl-10"
      type="text"
      :placeholder="String($t('button.search') + ' ...')"
      @keyup="onSearch()"
    />
    <label class="position-absolute top-1/2 -translate-y-1/2 left-3" for="search-input">
      <i class="flaticon-search"></i>
    </label>
  </div>
</template>

<style scoped>
@import "./SearchInput.scss";
</style>
