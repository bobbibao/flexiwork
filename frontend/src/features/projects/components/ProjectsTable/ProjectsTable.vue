<script lang="ts">
import ProjectsTable from "./ProjectsTable";
export default ProjectsTable;
</script>

<template>
  <div class="projects-table m-0">
    <ProjectTableLayout
      ref="TableProjects"
      select-mode="single"
      :data="listProjects"
      :fields="fields"
      :pagination="pagination"
      :isLoading="fetchingData"
      @rowSelected="openDetail"
      @onChangePage="handleChangePage"
    >
      <!-- Header -->
      <!-- @change="handleAllRowSelected($event)" -->
      <template #head(checkBox)="data">
        <b-form-checkbox
          :checked="areAllProjectsInTableSelected()"
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

      <template #head(projectNbr)="data">
        <div>
          {{ $t("offer.number") }}
        </div>
      </template>

      <template #head(title)="data">
        <div class="cursor-pointer" @click="handleSort('title')">
          {{ $t("offer.title") }}
          <SortIcon :currentOrder="sortOrder" orderField="title" />
        </div>
      </template>

      <template #head(sum)="data">
        <div>
          {{ $t("offer.sum") }}
        </div>
      </template>

      <template #head(invoiced)="data">
        <div>
          {{ $t("project.invoiced") }}
        </div>
      </template>

      <template #head(remaining)="data">
        <div>
          {{ $t("invoice.remain") }}
        </div>
      </template>

      <template #head(hoursTotal)="data">
        <div>
          {{ $t("dashboard.totalHour") }}
        </div>
      </template>

      <template #head(hoursWritten)="data">
        <div>
          {{ $t("dashboard.loggedHour") }}
        </div>
      </template>

      <template #head(status)="data">
        <div class="cursor-pointer" @click="handleSort('status')">
          {{ $t("offer.status") }}
          <SortIcon :currentOrder="sortOrder" orderField="status" />
        </div>
      </template>

      <template #head(createdOn)="data">
        <div class="cursor-pointer" @click="handleSort('createdOn')">
          {{ $t("project.created") }}
          <SortIcon :currentOrder="sortOrder" orderField="createdOn" />
        </div>
      </template>

      <template #head(endedOn)="data">
        <div class="cursor-pointer" @click="handleSort('endedOn')">
          {{ $t("project.ended") }}
          <SortIcon :currentOrder="sortOrder" orderField="endedOn" />
        </div>
      </template>

      <!-- Body -->
      <template #cell(checkBox)="data">
        <b-form-checkbox
          :checked="selectedProjects.includes(data.item.id)"
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

      <template #cell(projectNbr)="data">
        <span class="numeric-value">{{ data.item.projectNbr }}</span>
      </template>

      <template #cell(title)="data">
        <span class="truncate-text-project numeric-value" v-b-tooltip.hover.top :title="data.item.title">{{
          data.item.title
        }}</span>
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

      <template #cell(invoiced)="data">
        <div class="value-container">
          <div class="label-value">
            <span class="">{{ $t("project.net") }}: </span>
            <span class="numeric-value">{{ formatMoney(data.item.invoicedNet) }}</span>
          </div>
          <div class="label-value">
            <span class="">{{ $t("project.gross") }}: </span>
            <span class="numeric-value">{{ formatMoney(data.item.invoicedGross) }}</span>
          </div>
        </div>
      </template>

      <template #cell(remaining)="data">
        <div class="value-container">
          <div class="label-value">
            <span class="">{{ $t("project.net") }}: </span>
            <span class="numeric-value">{{ formatMoney(data.item.remainingNet) }}</span>
          </div>
          <div class="label-value">
            <span class="">{{ $t("project.gross") }}: </span>
            <span class="numeric-value">{{ formatMoney(data.item.remainingGross) }}</span>
          </div>
        </div>
      </template>

      <template #cell(hoursTotal)="data">
        <span class="numeric-value">{{ data.item.hoursTotal.toFixed(2) + "h" }}</span>
      </template>

      <template #cell(hoursWritten)="data">
        <SeverityBadge :title="data.item.hoursWritten.value" :color="data.item.hoursWritten.color" />
      </template>

      <template #cell(status)="data">
        <SeverityBadge :title="data.item.status.label" :color="data.item.status.color" />
      </template>

      <template #cell(createdOn)="data">
        {{ formatDate(data.item.createdOn, "DD.MM.YYYY") }}
      </template>

      <template #cell(endedOn)="data">
        {{ formatDate(data.item.endedOn, "DD.MM.YYYY") }}
      </template>

      <!-- <template #cell(formCheckbox)="data">
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
      </template> -->

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
          <ButtonCustom variant="link-gray" size="icon" @click="toggleSharing(data.item.id)">
            <template #start-icon>
              <PaperClip v-b-tooltip.hover :title="$t('button.connectOtherProjects')" />
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
                :body="$t('msg.delProject') + ' ' + data.item.companyName + '?'"
                @confirm="!!$event && deleteProject(data.item.id)"
              />
            </template>
          </ButtonCustom>
        </div>
      </template>
    </ProjectTableLayout>
  </div>
</template>

<style scoped>
@import "./ProjectsTable.scss";
</style>
