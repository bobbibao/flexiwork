<script lang="ts">
import OfferPage from "./Offer";
export default OfferPage;
</script>

<template>
  <div class="archapp-wrapper bg-white rounded-lg border border-secondary w-100 overflow-auto position-relative">
    <div class="py-6 px-8 mb-0 sticky bg-white top-0 z-10 top-section">
      <div class="d-flex justify-content-between">
        <SearchInput @onSearch="handleOnSearch($event)" />
        <div class="d-flex action-button-section gap-3">
          <div class="d-flex filter-section">
            <StatusFilterDropdown :statuses="statusOptions" @statusFilterChanged="handleStatusFilterChanged($event)" />
          </div>
          <ButtonCustom :text="$t('button.add')" @click="goTo('offer/create')">
            <template #start-icon>
              <PlusIcon width="30" height="35" />
            </template>
          </ButtonCustom>
        </div>
      </div>
      <div class="d-flex">
        <TotalSum :totalSumNet="totalSumNet" :totalSumGross="totalSumGross" />
      </div>
    </div>
    <OffersTable
      :offersData="offers"
      :currentPage="currentPage"
      :totalItems="totalItems"
      :totalPages="totalPages"
      :selectedOffers="selectedOffers"
      :sortOrder="sortOffers"
      :fetchingData="fetchingListOffers"
      @onSort="handleOnSortOffers($event)"
      @onOpenDetail="handleOnOpenDetail($event)"
      @onDeleteOffer="handleOnDeleteOffer"
      @onPrint="handleOnPrintOffer"
      @onCopy="handleOnCopyOffer"
      @onSelectOffer="handleSelectOffer"
      @toggleSelectAllOffersInTable="handleSelectAllOffers"
      @onOfferChangePage="fetchData"
      @onToggleOfferStatus="handleToggleOfferStatus"
    />
    <BulkActionToolbar
      :selectedOffers="selectedOffers"
      :statuses="statuses"
      @onDeleteBulk="handleDeleteBulk"
      @onCopyBulk="handleCopyBulk"
      @onPrintBulk="handlePrintBulk"
    />
  </div>
</template>

<style lang="scss" scoped>
@import "./Offer.scss";
</style>
