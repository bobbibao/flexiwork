<script lang="ts">
import ProjectPage from "./Project";
export default ProjectPage;
</script>

<template>
  <div class="flexiwork-wrapper">
    <div class="d-flex">
      <TotalSumProject :totalSumNet="123" :totalSumGross="123" :projectStats="projectStats" />
    </div>
    <div class="bg-white rounded-lg border border-secondary w-100 overflow-auto position-relative">
      <div class="py-6 px-8 mb-0 sticky bg-white top-0 z-10 top-section">
        <div class="d-flex justify-content-between">
          <SearchInput @onSearch="handleOnSearch($event)" />
          <div class="d-flex action-button-section gap-3">
            <div class="d-flex filter-section">
              <StatusFilterDropdown
                :statuses="statusOptions"
                @statusFilterChanged="handleStatusFilterChanged($event)"
              />
            </div>
            <ButtonCustom :text="$t('button.add')" @click="goTo('project/create')">
              <template #start-icon>
                <PlusIcon width="30" height="35" />
              </template>
            </ButtonCustom>
          </div>
        </div>
      </div>
      <!-- Add loading spinner -->
      <div v-if="loading" class="text-center text-danger my-4">
        <b-spinner class="align-middle"></b-spinner>
      </div>
      <div v-else>
        <ProjectsTable
          :projectsData="projects"
          :currentPage="currentPage"
          :totalItems="totalItems"
          :totalPages="totalPages"
          :selectedProjects="selectedProjects"
          :sortOrder="sortProjects"
          :fetchingData="fetchingListProjects"
          @onSort="handleOnSortProjects"
          @onChangePage="fetchData"
          @onOpenDetail="handleOnOpenDetail($event)"
          @onSelectProject="handleSelectProject"
          @onDeleteProject="handleOnDeleteProject"
          @toggleSelectAllProjectsInTable="handleSelectAllProjects"
          @onPrint="handleOnPrintProject"
          @onCopy="handleOnCopyProject"
          @onToggleSharing="handleOnToggleSharing"
        />
      </div>
      <BulkActionToolbar
        :selectedProjects="selectedProjects"
        :statuses="bulkStatusOptions"
        @onDeleteBulk="handleDeleteBulk"
        @onCopyBulk="handleCopyBulk"
        @onPrintBulk="handlePrintBulk"
        @onUpdateBulk="handleUpdateBulk"
      />
    </div>
    <ShareDialog
      :visible="share_dialog"
      @update:visible="share_dialog = $event"
      :projectId="selectedProjectConnectionId"
      @close="share_dialog = false"
      @connect="confirmConnect"
      @delete="deleteConnect"
    />
  </div>
</template>

<style lang="scss" scoped>
@import "./Project.scss";
</style>
