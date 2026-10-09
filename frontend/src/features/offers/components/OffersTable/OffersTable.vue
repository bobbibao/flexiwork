<script lang="ts">
import TableOverview from "../TableOverview/TableOverview.vue";
import OffersTable from "./OffersTable";
export default OffersTable;
</script>

<template>
  <div class="offers-table m-0">
    <TableOverview
      ref="TableOffers"
      select-mode="single"
      :data="listOffers"
      :fields="fields"
      :pagination="pagination"
      :isLoading="fetchingData"
      @rowSelected="openDetail"
      @onChangePage="handleChangePage"
    >
      <!-- Header -->
      <template #head(checkBox)="data">
        <b-form-checkbox
          :checked="areAllOffersInTableSelected()"
          @change="handleAllRowSelected($event)"
          class="visible-box"
          size="lg"
        ></b-form-checkbox>
      </template>

      <template #head(companyName)="data">
        <div class="cursor-pointer" @click="handleSort('companyName')">
          {{ $t("dashboard.customer") }}
          <SortIcon :currentOrder="sortOrder" orderField="companyName" />
        </div>
      </template>

      <template #head(project)="data">
        <div class="cursor-pointer" @click="handleSort('name')">
          {{ $t("offer.title") }}
          <SortIcon :currentOrder="sortOrder" orderField="name" />
        </div>
      </template>

      <template #head(projectNbr)="data">
        <div>
          {{ $t("offer.number") }}
        </div>
      </template>

      <template #head(sum)="data">
        <div class="text-left">{{ $t("offer.sum") }}</div>
      </template>

      <template #head(date)="data">
        <div class="cursor-pointer text-left" @click="handleSort('date')">
          {{ $t("offer.date") }}
          <SortIcon :currentOrder="sortOrder" orderField="date" />
        </div>
      </template>

      <template #head(status)="data">
        <div class="cursor-pointer" @click="handleSort('status')">
          {{ $t("offer.status") }}
          <SortIcon :currentOrder="sortOrder" orderField="status" />
        </div>
      </template>

      <!-- Body -->
      <template #cell(checkBox)="data">
        <b-form-checkbox
          :checked="selectedOffers.includes(data.item.id)"
          class="visible-box"
          size="lg"
          @change="handleSelectRow($event, data.item.id)"
        ></b-form-checkbox>
      </template>

      <template #cell(companyName)="data">
        <p class="row-bold">
          <span class="truncate-text-company" v-b-tooltip.hover.top :title="data.item.companyName">
            {{ data.item.companyName }}
          </span>
        </p>
      </template>

      <template #cell(project)="data">
        <span class="truncate-text-project" v-b-tooltip.hover.top :title="data.item.project">
          {{ data.item.project }}
        </span>
      </template>

      <template #cell(status)="data">
        <SeverityBadge :title="data.item.status.label" :color="data.item.status.color" />
      </template>

      <template #cell(projectNbr)="data">
        <span class="numeric-value">{{ data.item.projectNbr }}</span>
      </template>

      <template #cell(sum)="data">
        <div class="value-container">
          <div class="label-value">
            <span class="">{{ $t("project.net") }}: </span>
            <span class="numeric-value">{{ formatMoney(data.item.sumNet) }}</span>
          </div>
          <div class="label-value">
            <span class="">{{ $t("project.gross") }}: </span>
            <span class="numeric-value">{{ formatMoney(data.item.sumGross) }}</span>
          </div>
        </div>
      </template>

      <template #cell(date)="data">
        {{ formatDate(data.item.date, "DD.MM.YYYY") }}
      </template>

      <template #cell(formCheckbox)="data">
        <b-form-checkbox
          switch
          size="lg"
          :checked="data.item.status.value === 'active'"
          @change="onToggleOfferStatus(data.item.id)"
          :state="data.item.status.value === 'active'"
          class="custom-switch-success"
          v-b-tooltip.hover
          :title="[data.item.status.value === 'active' ? $t('button.deactivateOffer') : $t('button.activateOffer')]"
        ></b-form-checkbox>
      </template>

      <template #cell(actions)="data">
        <div class="archapp-table__col-actions">
          <ButtonCustom variant="link-gray" size="icon" @click="handlePrint(data.item.id)">
            <template #start-icon>
              <PrintIcon v-b-tooltip.hover="$t('button.print')" />
            </template>
          </ButtonCustom>
          <ButtonCustom variant="link-gray" size="icon" @click="handleCopy(data.item.id)">
            <template #start-icon>
              <CopyIcon v-b-tooltip.hover :title="$t('button.copy')" />
            </template>
          </ButtonCustom>
          <ButtonCustom
            variant="link-gray"
            size="icon"
            v-b-modal="'Delete-' + data.item.id"
            :disabled="data.item.status.value === 'deleted'"
          >
            <template #start-icon>
              <TrashDetailedIcon v-b-tooltip.hover="$t('button.delete')" />
              <ConfirmModal
                :modal-id="'Delete-' + data.item.id"
                :header="$t('title.confirm')"
                :body="$t('msg.delOffer') + ' ' + data.item.companyName + '?'"
                @confirm="!!$event && deleteOffer(data.item.id, data.item.status.label)"
              />
            </template>
          </ButtonCustom>
        </div>
      </template>
    </TableOverview>
  </div>
</template>

<style scoped>
@import "./OffersTable.scss";
</style>
