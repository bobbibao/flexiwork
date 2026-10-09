<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <h3 class="m-0">{{ $t("menu.report") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative rounded-xl">
        <b-tabs content-class="mt-3" fill>
          <b-tab :title="`${$t('report.singleAddress')}`" active>
            <!-- Address Report -->
            <div class="row mb-4">
              <div class="col-md-12">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.listAddress") }}
                </div>
              </div>
              <div class="col-md-3">
                <b-button variant="primary mr-2" class="print-btn" ref="kt_dl_address" @click="printAddress">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button variant="success" class="print-btn" ref="kt_dl_address_excel" @click="printAddressExcel">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
              </div>
            </div>
          </b-tab>

          <b-tab :title="`${$t('report.singleOffer')}`">
            <!-- Offer Report -->
            <div class="row mb-4">
              <div class="col-md-12">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.listOffer") }}
                </div>
              </div>
              <div class="col-md-2">
                <b-form-select
                  v-model="selected_offer_type"
                  :options="offer_type"
                  value-field="value"
                  text-field="name"
                ></b-form-select>
              </div>
              <div class="col-md-3">
                <b-button variant="primary mr-2" class="print-btn" ref="kt_dl_offer" @click="printOffer">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button variant="success" class="print-btn" ref="kt_dl_offer_excel" @click="printOfferExcel">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
              </div>
            </div>
          </b-tab>

          <b-tab :title="`${$t('report.singleProject')}`">
            <!-- Project Report -->
            <div class="row mb-4">
              <div class="col-md-12">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.listProject") }}
                </div>
              </div>
              <div class="col-md-2">
                <b-form-select
                  v-model="selected_project_type"
                  :options="project_type"
                  value-field="value"
                  text-field="name"
                ></b-form-select>
              </div>
              <div class="col-md-3">
                <b-button variant="primary" class="print-btn mr-2" ref="kt_dl_project" @click="printProject">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button variant="success" class="print-btn" ref="kt_dl_project_excel" @click="printProjectExcel">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
              </div>
            </div>

            <div style="border-top:1px solid rgba(0, 0, 0, 0.12); width:100%"></div>

            <!-- Single Project Report -->
            <div class="row mt-4 mb-4">
              <div class="col-md-12 mb-4">
                <div class="display-4 font-weight-bolder mb-2">
                  {{ $t("report.singleProject") }}
                </div>
              </div>
              <div class="col-md-2">
                <b-form-select
                  v-model="selected_company"
                  :options="companies"
                  value-field="id"
                  text-field="name"
                  multiple
                ></b-form-select>
              </div>
              <div class="col-md-2">
                <b-input-group>
                  <b-form-input v-model="startdate_formatted" type="text" autocomplete="off" readonly></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="startdate"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatDate"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-2">
                <b-input-group>
                  <b-form-input v-model="enddate_formatted" type="text" autocomplete="off" readonly></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="enddate"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatDate"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-5" style="display: flex; align-items: flex-start">
                <b-button variant="primary" class="mr-2" @click="getReportedProjects()">
                  <i class="flaticon2-check-mark p-0"></i>
                </b-button>
              </div>
              <div class="col-md-8 mt-4">
                <b-button variant="success" class="mr-2" @click="setProjectDate('today')">
                  {{ $t("timeOverview.today") }}
                </b-button>
                <b-button variant="info" class="mr-2" @click="setProjectDate('week')">
                  {{ $t("timeOverview.thisWeek") }}
                </b-button>
                <b-button variant="warning" class="mr-2" @click="setProjectDate('month')">
                  {{ $t("timeOverview.thisMonth") }}
                </b-button>
                <b-button variant="warning" class="mr-2" @click="setProjectDate('last month')">
                  {{ $t("timeOverview.lastMonth") }}
                </b-button>
                <b-button variant="danger" class="mr-2" @click="setProjectDate('year')">
                  {{ $t("timeOverview.thisYear") }}
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setProjectYear('2024')">
                  2024
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setProjectYear('2023')">
                  2023
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setProjectYear('2022')">
                  2022
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setProjectYear('2021')">
                  2021
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setProjectYear('2020')">
                  2020
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setProjectYear('start')">
                  Start
                </b-button>
              </div>
              <div class="col-md-4 mt-4 action">
                <b-button id="print-all" variant="primary" class="mr-2" @click="print_dialog = !print_dialog">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printAll") }}</span>
                </b-button>
                <b-button
                  id="print-all"
                  variant="primary"
                  @click="print_without_rate_dialog = !print_without_rate_dialog"
                >
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printAll") + " (" + $t("report.timeOnly") + ")" }}</span>
                </b-button>
              </div>
            </div>

            <!-- Search -->
            <div class="row mb-4">
              <div class="col-md-4 offset-md-8 mt-8">
                <b-form-input
                  v-model="filter"
                  type="search"
                  :placeholder="`${$t('button.search')}`"
                  id="filterInput"
                ></b-form-input>
              </div>
            </div>

            <div class="row">
              <div class="col-md-12 mb-4">
                <b-overlay :show="loading" variant="white" opacity="0.85" blur="5px" spinner-variant="danger">
                  <b-table
                    bordered
                    head-variant="light"
                    :items="currentProjectsWithLog"
                    :fields="fields"
                    :filter-included-fields="filterIncludedFields"
                    :filter="filter"
                    @filtered="onFiltered"
                  >
                    <template v-slot:cell(name)="row">
                      {{ row.item.name + ", " + row.item.location }}
                    </template>
                    <template v-slot:cell(action_1)="row">
                      <div>
                        <b-button
                          :id="`internal-${row.item.id}`"
                          variant="primary"
                          class="print-btn mr-2"
                          size="sm"
                          @click="printEffortInternal(row.item)"
                        >
                          <i class="flaticon2-printer p-0 mr-2"></i>
                          <span>{{ $t("button.printpdf") }}</span>
                        </b-button>
                        <b-button
                          :id="`internal-xlsx-${row.item.id}`"
                          variant="success"
                          class="print-btn mr-2"
                          size="sm"
                          @click="exportEffortInternalXlsx(row.item.id)"
                        >
                          <i class="flaticon2-printer p-0 mr-2"></i>
                          <span>{{ $t("button.printexcel") }}</span>
                        </b-button>
                        <b-button
                          :id="`internal-preview-${row.item.id}`"
                          variant="info"
                          size="sm"
                          @click="openPreviewInternal(row.item.id)"
                        >
                          <i class="flaticon-eye p-0 mr-2"></i>
                          <span>{{ $t("button.preview") }}</span>
                        </b-button>
                      </div>
                      <div class="mt-2">
                        <b-button
                          :id="`internal-without-rate-${row.item.id}`"
                          variant="primary"
                          class="print-btn mr-2"
                          size="sm"
                          @click="printEffortInternalWithoutRate(row.item)"
                        >
                          <i class="flaticon2-printer p-0 mr-2"></i>
                          <span>{{ $t("report.timeOnly") }}</span>
                        </b-button>
                        <b-button
                          :id="`internal-without-rate-preview-${row.item.id}`"
                          variant="info"
                          size="sm"
                          @click="openPreviewInternalWithoutRate(row.item.id)"
                        >
                          <i class="flaticon-eye p-0 mr-2"></i>
                          <span>{{ $t("button.preview") + " (" + $t("report.timeOnly") + ")" }}</span>
                        </b-button>
                      </div>
                    </template>

                    <template v-slot:cell(action_2)="row">
                      <div>
                        <b-button
                          :id="`external-${row.item.id}`"
                          variant="primary"
                          class="print-btn mr-2"
                          size="sm"
                          @click="printEffortExternal(row.item)"
                        >
                          <i class="flaticon2-printer p-0 mr-2"></i>
                          <span>{{ $t("button.printpdf") }}</span>
                        </b-button>
                        <b-button
                          :id="`external-xlsx-${row.item.id}`"
                          variant="success"
                          class="print-btn mr-2"
                          size="sm"
                          @click="exportEffortExternalXlsx(row.item.id)"
                        >
                          <i class="flaticon2-printer p-0 mr-2"></i>
                          <span>{{ $t("button.printexcel") }}</span>
                        </b-button>
                        <b-button
                          :id="`external-preview-${row.item.id}`"
                          variant="info"
                          size="sm"
                          @click="openPreviewExternal(row.item.id)"
                        >
                          <i class="flaticon-eye p-0 mr-2"></i>
                          <span>{{ $t("button.preview") }}</span>
                        </b-button>
                      </div>
                      <div class="mt-2">
                        <b-button
                          :id="`external-without-rate-${row.item.id}`"
                          variant="primary"
                          class="print-btn mr-2"
                          size="sm"
                          @click="printEffortExternalWithoutRate(row.item)"
                        >
                          <i class="flaticon2-printer p-0 mr-2"></i>
                          <span>{{ $t("report.timeOnly") }}</span>
                        </b-button>
                        <b-button
                          :id="`external-without-rate-preview-${row.item.id}`"
                          variant="info"
                          size="sm"
                          @click="openPreviewExternalWithoutRate(row.item.id)"
                        >
                          <i class="flaticon-eye p-0 mr-2"></i>
                          <span>{{ $t("button.preview") + " (" + $t("report.timeOnly") + ")" }}</span>
                        </b-button>
                      </div>
                    </template>
                  </b-table>
                </b-overlay>
              </div>

              <div class="col-md-12">
                <b-overlay :show="loading" variant="white" opacity="0.85" blur="5px" spinner-variant="danger">
                  <b-table
                    bordered
                    head-variant="light"
                    :items="currentProjectsWithLog"
                    :fields="phase_fields"
                    :filter-included-fields="filterIncludedFields"
                    :filter="filter"
                    @filtered="onFiltered"
                  >
                    <template v-slot:cell(name)="row">
                      {{ row.item.name + ", " + row.item.location }}
                    </template>
                    <template v-slot:cell(action_1)="row">
                      <b-button
                        :id="`project-by-phase-${row.item.id}`"
                        variant="primary mr-2"
                        @click="printProjectByPhases(row.item)"
                      >
                        <i class="flaticon2-printer p-0 mr-2"></i>
                        <span>{{ $t("button.printpdf") }}</span>
                      </b-button>
                      <b-button
                        v-show="false"
                        :id="`project-by-phase-xlsx-${row.item.id}`"
                        variant="success mr-2"
                        @click="printEffortByPhaseExcel(row.item.id)"
                      >
                        <i class="flaticon2-printer p-0 mr-2"></i>
                        <span>{{ $t("button.printexcel") }}</span>
                      </b-button>
                      <b-button
                        :id="`project-by-phase-preview-${row.item.id}`"
                        variant="success"
                        @click="openPreviewEffortByPhase(row.item.id)"
                      >
                        <i class="flaticon-eye p-0 mr-2"></i>
                        <span>{{ $t("button.preview") }}</span>
                      </b-button>
                    </template>
                    <template v-slot:cell(action_2)="row">
                      <b-button
                        :id="`project-by-task-${row.item.id}`"
                        variant="primary mr-2"
                        @click="printProjectByTasks(row.item)"
                      >
                        <i class="flaticon2-printer p-0 mr-2"></i>
                        <span>{{ $t("button.printpdf") }}</span>
                      </b-button>
                      <b-button
                        v-show="false"
                        :id="`project-by-task-xlsx-${row.item.id}`"
                        variant="success mr-2"
                        @click="printEffortByTaskExcel(row.item.id)"
                      >
                        <i class="flaticon2-printer p-0 mr-2"></i>
                        <span>{{ $t("button.printexcel") }}</span>
                      </b-button>
                      <b-button
                        :id="`project-by-task-preview-${row.item.id}`"
                        variant="success"
                        @click="openPreviewEffortByTask(row.item.id)"
                      >
                        <i class="flaticon-eye p-0 mr-2"></i>
                        <span>{{ $t("button.preview") }}</span>
                      </b-button>
                    </template>
                  </b-table>
                </b-overlay>
              </div>
            </div>
          </b-tab>

          <b-tab :title="`${$t('report.singleProjectSummary')}`">
            <!-- Project Summary Report-->
            <div class="row mt-4 mb-4">
              <div class="col-md-12 mt-4">
                <div class="mb-4">
                  <b-badge
                    class="filter-badge"
                    :class="{ active: status_summary === 'active' }"
                    variant="success"
                    @click="filterProjectSummary('active')"
                  >
                    <div class="text-capitalize">
                      {{ $t("status.active") }}
                    </div>
                  </b-badge>
                  <b-badge
                    class="filter-badge ml-2"
                    :class="{ active: status_summary === 'archive' }"
                    @click="filterProjectSummary('archive')"
                  >
                    <div class="text-capitalize">
                      {{ $t("status.archive") }}
                    </div>
                  </b-badge>
                </div>

                <b-overlay :show="loading" variant="white" opacity="0.85" blur="5px" spinner-variant="danger">
                  <b-table
                    bordered
                    head-variant="light"
                    :items="currentProjectWithSummary"
                    :fields="summry_fields"
                    :filter-included-fields="filterIncludedFields"
                    :filter="filter"
                    :sort-by.sync="sortBy"
                    :sort-desc.sync="sortDesc"
                    @filtered="onFiltered"
                  >
                    <template v-slot:cell(name)="row">
                      {{ row.item.name + ", " + row.item.location }}
                    </template>
                    <template v-slot:cell(number)="row">
                      {{ row.item.number.custom_id ? row.item.number.custom_id : row.item.number.id }}
                    </template>
                    <template v-slot:cell(action)="row">
                      <b-button
                        :id="`project-by-invoices-${row.item.id}`"
                        variant="primary mr-2"
                        @click="printProjectByAllInvoices(row.item)"
                      >
                        <i class="flaticon2-printer p-0 mr-2"></i>
                        <span>{{ $t("button.printpdf") }}</span>
                      </b-button>
                      <b-button
                        :id="`project-by-invoices-xlsx-${row.item.id}`"
                        variant="success mr-2"
                        @click="printProjectByAllInvoicesExcel(row.item.id)"
                      >
                        <i class="flaticon2-printer p-0 mr-2"></i>
                        <span>{{ $t("button.printexcel") }}</span>
                      </b-button>
                      <b-button
                        :id="`project-by-invoices-preview-${row.item.id}`"
                        variant="info"
                        @click="openPreviewEffortByAllInvoices(row.item.id)"
                      >
                        <i class="flaticon-eye p-0 mr-2"></i>
                        <span>{{ $t("button.preview") }}</span>
                      </b-button>
                    </template>
                  </b-table>
                </b-overlay>
              </div>
            </div>
          </b-tab>

          <b-tab :title="`${$t('report.singleInvoice')}`">
            <!-- Invoice Report -->
            <div class="row mb-4">
              <div class="col-md-12">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.listInvoice") }}
                </div>
              </div>
              <div class="col-md-2">
                <b-form-select
                  v-model="selected_invoice_type"
                  :options="invoice_type"
                  value-field="value"
                  text-field="name"
                  multiple
                ></b-form-select>
              </div>
              <div class="col-md-4">
                <b-form-select
                  v-model="selected_invoice_customer"
                  :options="invoice_customer"
                  value-field="id"
                  text-field="name"
                  multiple
                  :select-size="10"
                ></b-form-select>
              </div>
              <div class="col-md-2">
                <b-input-group>
                  <b-form-input
                    v-model="startdate_status_formatted"
                    type="text"
                    autocomplete="off"
                    readonly
                  ></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="startdate_status"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatStatusDate"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-2">
                <b-input-group>
                  <b-form-input
                    v-model="enddate_status_formatted"
                    type="text"
                    autocomplete="off"
                    readonly
                  ></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="enddate_status"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatStatusDate"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-8 mt-4">
                <b-button variant="success" class="mr-2" @click="setInvoiceDate('today')">
                  {{ $t("timeOverview.today") }}
                </b-button>
                <b-button variant="info" class="mr-2" @click="setInvoiceDate('week')">
                  {{ $t("timeOverview.thisWeek") }}
                </b-button>
                <b-button variant="warning" class="mr-2" @click="setInvoiceDate('month')">
                  {{ $t("timeOverview.thisMonth") }}
                </b-button>
                <b-button variant="warning" class="mr-2" @click="setInvoiceDate('last month')">
                  {{ $t("timeOverview.lastMonth") }}
                </b-button>
                <b-button variant="danger" class="mr-2" @click="setInvoiceDate('year')">
                  {{ $t("timeOverview.thisYear") }}
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setInvoiceYear('2024')">
                  2024
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setInvoiceYear('2023')">
                  2023
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setInvoiceYear('2022')">
                  2022
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setInvoiceYear('2021')">
                  2021
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setInvoiceYear('2020')">
                  2020
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setInvoiceYear('start')">
                  Start
                </b-button>
              </div>
              <div class="col-md-4 mt-4 action">
                <b-button variant="primary" class="print-btn mr-2" ref="kt_dl_invoice" @click="printInvoice">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button variant="success" class="print-btn" ref="kt_dl_invoice_excel" @click="printInvoiceExcel">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
              </div>
            </div>
          </b-tab>

          <b-tab :title="`${$t('report.singleUser')}`">
            <!-- User Report -->
            <div class="row mb-4">
              <div class="col-md-12">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.listUser") }}
                </div>
                <b-button variant="primary" class="print-btn mr-2" ref="kt_dl_user" @click="printUser">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button variant="success" class="print-btn" ref="kt_dl_user_excel" @click="printUserExcel">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
              </div>
            </div>
            <!-- Job Report -->
            <div class="row mb-4">
              <div class="col-md-12">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.listJob") }}
                </div>
                <b-button variant="primary" class="print-btn mr-2" ref="kt_dl_job" @click="printJob">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button
                  variant="success"
                  class="print-btn"
                  ref="kt_dl_user_with_rate_excel"
                  @click="printUserWithRateExcel"
                >
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
              </div>
            </div>

            <div style="border-top:1px solid rgba(0, 0, 0, 0.12); width:100%"></div>

            <!-- Single User Report -->
            <div class="row mt-4 mb-4">
              <div class="col-md-12 mb-4">
                <div class="display-4 font-weight-bolder mb-2">
                  {{ $t("report.listHour") }}
                </div>
              </div>
              <div class="col-md-2">
                <b-form-select
                  v-model="selected_employee"
                  :options="employees"
                  value-field="id"
                  text-field="name"
                ></b-form-select>
              </div>
              <div class="col-md-2">
                <b-input-group>
                  <b-form-input
                    v-model="startdate_flexible_formatted"
                    type="text"
                    autocomplete="off"
                    readonly
                  ></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="startdate_flexible"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatFlexibleDate"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-2">
                <b-input-group>
                  <b-form-input
                    v-model="enddate_flexible_formatted"
                    type="text"
                    autocomplete="off"
                    readonly
                  ></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="enddate_flexible"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatFlexibleDate"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-12 mt-4">
                <b-button variant="success" class="mr-2" @click="setFlexibleDate('today')">
                  {{ $t("timeOverview.today") }}
                </b-button>
                <b-button variant="info" class="mr-2" @click="setFlexibleDate('week')">
                  {{ $t("timeOverview.thisWeek") }}
                </b-button>
                <b-button variant="warning" class="mr-2" @click="setFlexibleDate('month')">
                  {{ $t("timeOverview.thisMonth") }}
                </b-button>
                <b-button variant="warning" class="mr-2" @click="setFlexibleDate('last month')">
                  {{ $t("timeOverview.lastMonth") }}
                </b-button>
                <b-button variant="danger" class="mr-2" @click="setFlexibleDate('year')">
                  {{ $t("timeOverview.thisYear") }}
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setFlexibleYear('2024')">
                  2024
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setFlexibleYear('2023')">
                  2023
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setFlexibleYear('2022')">
                  2022
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setFlexibleYear('2021')">
                  2021
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setFlexibleYear('2020')">
                  2020
                </b-button>
                <b-button variant="primary" class="mr-2" @click="setFlexibleYear('start')">
                  Start
                </b-button>
              </div>
            </div>

            <div class="row">
              <div class="col-md-12">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.byHoliday") }}
                </div>
                <b-button variant="primary" class="print-btn mr-2" ref="kt_dl_holiday" @click="printHoliday">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button
                  v-show="false"
                  variant="success"
                  class="print-btn mr-2"
                  ref="kt_dl_holiday_excel"
                  @click="printHolidayExcel"
                >
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
                <b-button variant="info" @click="openPreviewHoliday">
                  <i class="flaticon-eye p-0 mr-2"></i>
                  <span>{{ $t("button.preview") }}</span>
                </b-button>
              </div>

              <div class="col-md-12 mt-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("report.byUserEffort") }}
                </div>
                <b-button variant="primary" class="print-btn mr-2" ref="kt_dl_effort" @click="printUserEffort">
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printpdf") }}</span>
                </b-button>
                <b-button
                  v-show="false"
                  variant="success"
                  class="print-btn"
                  ref="kt_dl_effort_excel"
                  @click="printUserEffortExcel"
                >
                  <i class="flaticon2-printer p-0 mr-2"></i>
                  <span>{{ $t("button.printexcel") }}</span>
                </b-button>
                <b-button variant="info" @click="openPreviewUserEffort">
                  <i class="flaticon-eye p-0 mr-2"></i>
                  <span>{{ $t("button.preview") }}</span>
                </b-button>
              </div>
            </div>
          </b-tab>
        </b-tabs>
      </div>
    </div>

    <!-- Confirm print all Dialog -->
    <b-modal v-model="print_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.confirmPrint") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="printAllEffort()">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Confirm print all Dialog without rate -->
    <b-modal v-model="print_without_rate_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.confirmPrint") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="printAllEffortWithoutRate()">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import i18nService from "@/core/services/i18n.service.js";
import moment from "moment";
import { mapState, mapGetters } from "vuex";
import {
  SET_REPORT_ERROR,
  EXPORT_USER_REPORT,
  EXPORT_USER_REPORT_EXCEL,
  EXPORT_USER_WITH_RATE_REPORT_EXCEL,
  EXPORT_JOB_REPORT,
  EXPORT_PROJECT_REPORT_PDF,
  EXPORT_OFFER_REPORT_PDF,
  EXPORT_INVOICE_REPORT_PDF,
  EXPORT_ADDRESS_REPORT_PDF,
  EXPORT_PROJECT_REPORT_EXCEL,
  EXPORT_INVOICE_REPORT_EXCEL,
  EXPORT_ADDRESS_REPORT_EXCEL,
  EXPORT_EFFORT_EXTERNAL_REPORT,
  EXPORT_EFFORT_INTERNAL_REPORT,
  EXPORT_EFFORT_EXTERNAL_WITHOUT_RATE_REPORT,
  EXPORT_EFFORT_INTERNAL_WITHOUT_RATE_REPORT,
  EXPORT_EFFORT_EXTERNAL_EXCEL,
  EXPORT_EFFORT_INTERNAL_EXCEL,
  // EXPORT_EFFORT_EXTERNAL_WITHOUT_RATE_EXCEL,
  // EXPORT_EFFORT_INTERNAL_WITHOUT_RATE_EXCEL,
  GET_PROJECTS_WITH_LOG,
  GET_PROJECTS_WITH_SUMMARY,
  EXPORT_OFFER_REPORT_EXCEL,
  GET_ADDRESS_REPORT,
  EXPORT_FLEXIBLE_REPORT,
  EXPORT_EFFORT_REPORT,
  EXPORT_FLEXIBLE_REPORT_EXCEL,
  EXPORT_PROJECT_BY_PHASES,
  EXPORT_PROJECT_BY_TASKS,
  EXPORT_PROJECT_BY_ALL_INVOICES,
  EXPORT_PROJECT_BY_ALL_INVOICES_EXCEL
} from "@/core/services/store/report";
import { GET_CONNECTIONS, GET_COMPANY, GET_USERS, GET_SETTINGS } from "@/core/services/store/settings";
import { generateHTMLToPDF } from "@/common/generatePdfUtils";
import { saveAs } from "file-saver";
import { ReportExportCode } from "@/common/constants";
import { generateExportFileName } from "@/common";
import { formatDate } from "@/common";

export default {
  name: "report",
  metaInfo: {
    title: "Report",
    meta: [
      { hid: "description", name: "description", content: "Report Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Report | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Report | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  data() {
    return {
      sortBy: "project_nbr_and_name",
      sortDesc: false,
      fields: [
        {
          key: "number",
          label: this.$t("project.number"),
          thStyle: { width: "15%" }
        },
        {
          key: "name",
          label: this.$t("project.title"),
          thStyle: { width: "25%" }
        },
        {
          key: "action_1",
          label: this.$t("report.internal"),
          thStyle: { width: "30%" }
        },
        {
          key: "action_2",
          label: this.$t("report.external"),
          thStyle: { width: "30%" }
        }
      ],
      phase_fields: [
        {
          key: "number",
          label: this.$t("project.number"),
          thStyle: { width: "15%" }
        },
        {
          key: "name",
          label: this.$t("project.title"),
          thStyle: { width: "25%" }
        },
        {
          key: "action_1",
          label: this.$t("report.byPhase"),
          thStyle: { width: "20%" }
        },
        {
          key: "action_2",
          label: this.$t("report.byTask"),
          thStyle: { width: "20%" }
        }
      ],
      summry_fields: [
        {
          key: "number",
          label: this.$t("project.number"),
          thStyle: { width: "15%" }
        },
        {
          key: "name",
          label: this.$t("project.title"),
          thStyle: { width: "25%" }
        },
        {
          key: "action",
          label: this.$t("report.byAllInvoices"),
          thStyle: { width: "60%" }
        }
      ],
      filter: null,
      filterIncludedFields: ["number", "name", "location"],
      employees: [],
      selected_employee: 0,
      invoice_type: [
        { name: this.$t("status.all"), value: "all" },
        { name: this.$t("status.open"), value: "open" },
        { name: this.$t("status.paid"), value: "paid" },
        {
          name: this.$t("status.reminder"),
          value: "reminders"
        }
      ],
      invoice_customer: [],
      selected_invoice_type: [],
      selected_invoice_customer: [],
      offer_type: [
        { name: this.$t("status.all"), value: "all" },
        { name: this.$t("status.active"), value: "active" },
        { name: this.$t("status.deleted"), value: "deleted" },
        { name: this.$t("status.archive"), value: "archive" }
      ],
      selected_offer_type: "all",
      project_type: [
        { name: this.$t("status.all"), value: "all" },
        { name: this.$t("status.active"), value: "active" },
        { name: this.$t("status.archive"), value: "archive" }
      ],
      selected_project_type: "all",
      companies: [],
      selected_company: [],
      startdate: "",
      enddate: "",
      startdate_formatted: "",
      enddate_formatted: "",
      startdate_status: "",
      enddate_status: "",
      startdate_status_formatted: "",
      enddate_status_formatted: "",
      startdate_flexible: "",
      enddate_flexible: "",
      startdate_flexible_formatted: "",
      enddate_flexible_formatted: "",
      startdate_summary: "",
      enddate_summary: "",
      status_summary: "active",
      locale: "de",
      print_dialog: false,
      print_without_rate_dialog: false,
      loading: false
    };
  },
  computed: {
    ...mapGetters([
      "currentProjectsWithLog",
      "currentProjectWithSummary",
      "currentConnections",
      "currentCompany",
      "currentAddressReport",
      "currentUsers",
      "currentSettings"
    ]),
    ...mapState({
      error: state => state.report.error,
      user_pdf_code: state => state.report.user_pdf_code,
      download_code: state => state.report.download_code,
      job_pdf_code: state => state.report.job_pdf_code,
      offer_pdf_code: state => state.report.offer_pdf_code,
      project_pdf_code: state => state.report.project_pdf_code,
      invoice_pdf_code: state => state.report.invoice_pdf_code,
      address_pdf_code: state => state.report.address_pdf_code,
      invoice_excel_code: state => state.report.invoice_excel_code,
      project_excel_code: state => state.report.project_excel_code,
      address_excel_code: state => state.report.address_excel_code,
      effort_external_pdf_code: state => state.report.effort_external_pdf_code,
      effort_internal_pdf_code: state => state.report.effort_internal_pdf_code,
      effort_external_without_rate_pdf_code: state => state.report.effort_external_without_rate_pdf_code,
      effort_internal_without_rate_pdf_code: state => state.report.effort_internal_without_rate_pdf_code,
      effort_external_excel_code: state => state.report.effort_external_excel_code,
      effort_internal_excel_code: state => state.report.effort_internal_excel_code,
      effort_external_without_rate_excel_code: state => state.report.effort_external_without_rate_excel_code,
      effort_internal_without_rate_excel_code: state => state.report.effort_internal_without_rate_excel_code,
      holiday_pdf_code: state => state.report.holiday_pdf_code,
      holiday_excel_code: state => state.report.holiday_excel_code,
      user_effort_code: state => state.report.user_effort_code,
      project_by_phases_code: state => state.report.project_by_phases_code,
      project_by_tasks_code: state => state.report.project_by_tasks_code,
      project_by_invoices_code: state => state.report.project_by_invoices_code,
      project_by_invoices_excel_code: state => state.report.project_by_invoices_excel_code
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    this.initDate();
    await this.getConnections();
    await this.getReportedProjects();
    await this.getSummaryProjects();
    await this.getAddresses();
    await this.getEmployees();
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
  },
  methods: {
    initDate() {
      this.startdate = moment()
        .startOf("month")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.startdate_formatted = moment()
        .startOf("month")
        .format("DD.MM.YYYY");
      this.enddate_formatted = moment()
        .endOf("month")
        .format("DD.MM.YYYY");
      this.startdate_status = moment()
        .startOf("month")
        .format("YYYY-MM-DD");
      this.enddate_status = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.startdate_status_formatted = moment()
        .startOf("month")
        .format("DD.MM.YYYY");
      this.enddate_status_formatted = moment()
        .endOf("month")
        .format("DD.MM.YYYY");
      this.startdate_flexible = moment()
        .startOf("year")
        .format("YYYY-MM-DD");
      this.enddate_flexible = moment()
        .endOf("year")
        .format("YYYY-MM-DD");
      this.startdate_flexible_formatted = moment()
        .startOf("year")
        .format("DD.MM.YYYY");
      this.enddate_flexible_formatted = moment()
        .endOf("year")
        .format("DD.MM.YYYY");
      this.startdate_summary = "2018-01-01";
      this.enddate_summary = moment().format("YYYY-MM-DD");
    },
    setInvoiceDate(type) {
      if (type === "week") {
        const start = moment().startOf("isoWeek");
        const end = moment().endOf("isoWeek");
        this.startdate_status = start.format("YYYY-MM-DD");
        this.enddate_status = end.format("YYYY-MM-DD");
        this.startdate_status_formatted = start.format("DD.MM.YYYY");
        this.enddate_status_formatted = end.format("DD.MM.YYYY");
      } else if (type === "month") {
        const start = moment().startOf("month");
        const end = moment().endOf("month");
        this.startdate_status = start.format("YYYY-MM-DD");
        this.enddate_status = end.format("YYYY-MM-DD");
        this.startdate_status_formatted = start.format("DD.MM.YYYY");
        this.enddate_status_formatted = end.format("DD.MM.YYYY");
      } else if (type === "last month") {
        const start = moment()
          .subtract(1, "months")
          .startOf("month");
        const end = moment()
          .subtract(1, "months")
          .endOf("month");
        this.startdate_status = start.format("YYYY-MM-DD");
        this.enddate_status = end.format("YYYY-MM-DD");
        this.startdate_status_formatted = start.format("DD.MM.YYYY");
        this.enddate_status_formatted = end.format("DD.MM.YYYY");
      } else if (type === "year") {
        const start = moment().startOf("year");
        const end = moment().endOf("year");
        this.startdate_status = start.format("YYYY-MM-DD");
        this.enddate_status = end.format("YYYY-MM-DD");
        this.startdate_status_formatted = start.format("DD.MM.YYYY");
        this.enddate_status_formatted = end.format("DD.MM.YYYY");
      } else {
        const today = moment();
        this.startdate_status = today.format("YYYY-MM-DD");
        this.enddate_status = today.format("YYYY-MM-DD");
        this.startdate_status_formatted = today.format("DD.MM.YYYY");
        this.enddate_status_formatted = today.format("DD.MM.YYYY");
      }
    },
    setInvoiceYear(year) {
      if (year === "start") {
        this.startdate_status = "2018-01-01";
        this.enddate_status = moment().format("YYYY-MM-DD");
        this.startdate_status_formatted = "01.01.2018";
        this.enddate_status_formatted = moment().format("DD.MM.YYYY");
      } else {
        this.startdate_status = year + "-01-01";
        this.enddate_status = year + "-12-31";
        this.startdate_status_formatted = "01.01." + year;
        this.enddate_status_formatted = "31.12." + year;
      }
    },
    setFlexibleDate(type) {
      if (type === "week") {
        const start = moment().startOf("isoWeek");
        const end = moment().endOf("isoWeek");
        this.startdate_flexible = start.format("YYYY-MM-DD");
        this.enddate_flexible = end.format("YYYY-MM-DD");
        this.startdate_flexible_formatted = start.format("DD.MM.YYYY");
        this.enddate_flexible_formatted = end.format("DD.MM.YYYY");
      } else if (type === "month") {
        const start = moment().startOf("month");
        const end = moment().endOf("month");
        this.startdate_flexible = start.format("YYYY-MM-DD");
        this.enddate_flexible = end.format("YYYY-MM-DD");
        this.startdate_flexible_formatted = start.format("DD.MM.YYYY");
        this.enddate_flexible_formatted = end.format("DD.MM.YYYY");
      } else if (type === "last month") {
        const start = moment()
          .subtract(1, "months")
          .startOf("month");
        const end = moment()
          .subtract(1, "months")
          .endOf("month");
        this.startdate_flexible = start.format("YYYY-MM-DD");
        this.enddate_flexible = end.format("YYYY-MM-DD");
        this.startdate_flexible_formatted = start.format("DD.MM.YYYY");
        this.enddate_flexible_formatted = end.format("DD.MM.YYYY");
      } else if (type === "year") {
        const start = moment().startOf("year");
        const end = moment().endOf("year");
        this.startdate_flexible = start.format("YYYY-MM-DD");
        this.enddate_flexible = end.format("YYYY-MM-DD");
        this.startdate_flexible_formatted = start.format("DD.MM.YYYY");
        this.enddate_flexible_formatted = end.format("DD.MM.YYYY");
      } else {
        const today = moment();
        this.startdate_flexible = today.format("YYYY-MM-DD");
        this.enddate_flexible = today.format("YYYY-MM-DD");
        this.startdate_flexible_formatted = today.format("DD.MM.YYYY");
        this.enddate_flexible_formatted = today.format("DD.MM.YYYY");
      }
    },
    setFlexibleYear(year) {
      if (year === "start") {
        this.startdate_flexible = "2018-01-01";
        this.enddate_flexible = moment().format("YYYY-MM-DD");
        this.startdate_flexible_formatted = "01.01.2018";
        this.enddate_flexible_formatted = moment().format("DD.MM.YYYY");
      } else {
        this.startdate_flexible = year + "-01-01";
        this.enddate_flexible = year + "-12-31";
        this.startdate_flexible_formatted = "01.01." + year;
        this.enddate_flexible_formatted = "31.12." + year;
      }
    },
    async setProjectYear(year) {
      if (year === "start") {
        this.startdate = "2018-01-01";
        this.enddate = moment().format("YYYY-MM-DD");
        this.startdate_formatted = "01.01.2018";
        this.enddate_formatted = moment().format("DD.MM.YYYY");
      } else {
        this.startdate = year + "-01-01";
        this.enddate = year + "-12-31";
        this.startdate_formatted = "01.01." + year;
        this.enddate_formatted = "31.12." + year;
      }
      await this.getReportedProjects();
    },
    async setProjectDate(type) {
      if (type === "week") {
        const start = moment().startOf("isoWeek");
        const end = moment().endOf("isoWeek");
        this.startdate = start.format("YYYY-MM-DD");
        this.enddate = end.format("YYYY-MM-DD");
        this.startdate_formatted = start.format("DD.MM.YYYY");
        this.enddate_formatted = end.format("DD.MM.YYYY");
      } else if (type === "month") {
        const start = moment().startOf("month");
        const end = moment().endOf("month");
        this.startdate = start.format("YYYY-MM-DD");
        this.enddate = end.format("YYYY-MM-DD");
        this.startdate_formatted = start.format("DD.MM.YYYY");
        this.enddate_formatted = end.format("DD.MM.YYYY");
      } else if (type === "year") {
        const start = moment().startOf("year");
        const end = moment().endOf("year");
        this.startdate = start.format("YYYY-MM-DD");
        this.enddate = end.format("YYYY-MM-DD");
        this.startdate_formatted = start.format("DD.MM.YYYY");
        this.enddate_formatted = end.format("DD.MM.YYYY");
      } else if (type === "last month") {
        const start = moment()
          .subtract(1, "months")
          .startOf("month");
        const end = moment()
          .subtract(1, "months")
          .endOf("month");
        this.startdate = start.format("YYYY-MM-DD");
        this.enddate = end.format("YYYY-MM-DD");
        this.startdate_formatted = start.format("DD.MM.YYYY");
        this.enddate_formatted = end.format("DD.MM.YYYY");
      } else {
        const today = moment();
        this.startdate = today.format("YYYY-MM-DD");
        this.enddate = today.format("YYYY-MM-DD");
        this.startdate_formatted = today.format("DD.MM.YYYY");
        this.enddate_formatted = today.format("DD.MM.YYYY");
      }
      await this.getReportedProjects();
    },
    async getReportedProjects() {
      await this.$store.dispatch(GET_PROJECTS_WITH_LOG, {
        company_id: this.selected_company,
        start: this.startdate,
        end: this.enddate
      });
    },
    async getSummaryProjects() {
      await this.$store.dispatch(GET_PROJECTS_WITH_SUMMARY, {
        company_id: 0,
        start: this.startdate_summary,
        end: this.enddate_summary,
        status: this.status_summary
      });
    },
    async getConnections() {
      let arr = [];
      await this.$store.dispatch(GET_COMPANY);
      await this.$store.dispatch(GET_SETTINGS);
      await this.$store.dispatch(GET_CONNECTIONS);

      arr.push({
        name: this.$t("status.all"),
        id: 0
      });
      arr.push({
        name: this.currentCompany.name,
        id: this.currentCompany.id
      });
      for (const item of this.currentConnections) {
        let company = {
          name: item.company.name,
          id: item.company.id
        };
        arr.push(company);
      }
      this.companies = arr;
      this.selected_company.push(arr[0].id);
    },
    async getAddresses() {
      let arr = [];
      await this.$store.dispatch(GET_ADDRESS_REPORT);

      arr.push({ name: this.$t("status.all"), id: "all" });
      for (const item of this.currentAddressReport) {
        arr.push({
          name: item.type === "company" ? item.company : item.first_name + " " + item.last_name,
          id: item.id
        });
      }
      this.invoice_customer = arr;
    },
    async getEmployees() {
      let arr = [];
      await this.$store.dispatch(GET_USERS);

      for (const item of this.currentUsers) {
        arr.push({
          id: item.id,
          name: item.first_name + " " + item.last_name
        });
      }
      this.employees = arr;
      this.selected_employee = arr[0].id;
    },
    async filterProjectSummary(status) {
      this.status_summary = status;
      await this.getSummaryProjects();
    },
    async printUser() {
      // set spinner to button
      let button = this.$refs["kt_dl_user"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      try {
        await this.$store.dispatch(EXPORT_USER_REPORT, {
          lang: this.locale === "de" ? "de" : "en"
        });

        if (this.error) {
          throw new Error(this.error);
        }

        const contentWidth = 1150;
        const margins = [30, 0, 45, 0];
        const props = {
          title: "listEmployee",
          listName: this.currentLanguage === "de" ? "Liste der aktuellen Mitarbeiter" : "List of current employees",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
          .first-page {
            padding-left: 120px;
            padding-right: 85px;
          }
          td div {
            font-size: 14px;
            page-break-inside: avoid;
            margin: 4px 4px 4px 0px;
          }
        `;
        const htmlElement = await this.getIframeContent(this.user_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EMPLOYEE);
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async printUserExcel() {
      // set spinner to button
      let button = this.$refs["kt_dl_user_excel"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_USER_REPORT_EXCEL, {
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;

        const popUp = window.open(this.download_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printUserWithRateExcel() {
      // set spinner to button
      let button = this.$refs["kt_dl_user_with_rate_excel"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_USER_WITH_RATE_REPORT_EXCEL, {
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;

        const popUp = window.open(this.download_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printOfferExcel() {
      // set spinner to button
      let button = this.$refs["kt_dl_offer_excel"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_OFFER_REPORT_EXCEL, {
        status: this.selected_offer_type,
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;

        const popUp = window.open(this.download_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printJob() {
      // set spinner to button
      let button = this.$refs["kt_dl_job"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      try {
        await this.$store.dispatch(EXPORT_JOB_REPORT, {
          lang: this.locale === "de" ? "de" : "en"
        });

        if (this.error) {
          throw new Error(this.error);
        }

        const contentWidth = 1150;
        const margins = [30, 0, 45, 0];

        const props = {
          title: "listEmployeeJob",
          listName:
            this.currentLanguage === "de"
              ? "Liste der aktuellen Mitarbeiter mit Honorarkategorie und Tarif"
              : "List of current employees with job and rate",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };

        const pdfStyles = `
          .first-page {
            padding-left: 120px;
            padding-right: 85px;
          }
          td div {
            font-size: 14px;
            page-break-inside: avoid;
            margin: 4px 4px 4px 0px;
          }
        `;

        const htmlElement = await this.getIframeContent(this.job_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EMPLOYEE_WITH_RATE);
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async printAddress() {
      // set spinner to button
      let button = this.$refs["kt_dl_address"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_ADDRESS_REPORT_PDF, {
          lang: this.locale === "de" ? "de" : "en"
        });

        if (this.error) {
          throw new Error(this.error);
        }

        const contentWidth = 1150;
        const margins = [30, 0, 45, 0];

        const props = {
          title: "address",
          listName: this.currentLanguage === "de" ? "Liste der Adressen" : "List of addresses",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "l",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 85px;
              padding-right: 85px;
              margin-bottom: -10px;
            }
            td div {
              font-size: 13px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            body {
              display: block;
              color: black;
              line-height: 1.1;
              background-color: #fff;
              font-size: 14px !important;
            }
          `;
        const htmlElement = await this.getIframeContent(this.address_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_ADDRESS);
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    getIframeContent(url, pdfStyles) {
      return new Promise((resolve, reject) => {
        const fullUrl = new URL(url, window.location.origin);

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        // Add load event listener
        iframe.onload = () => {
          try {
            setTimeout(() => {
              const exportElement = iframe.contentDocument.getElementById("export-report");
              if (!exportElement) {
                throw new Error("Element with id 'export-report' not found");
              }

              // Deep clone the element
              const clonedElement = exportElement.cloneNode(true);

              // Copy styles from iframe document
              const styles = iframe.contentDocument.getElementsByTagName("style");
              const styleSheet = document.createElement("style");
              for (let style of styles) {
                // Remove scoped attribute to allow styles to apply
                const css = style.innerHTML.replace(/\[data-v-\w+\]/g, "");
                styleSheet.appendChild(document.createTextNode(css));
              }
              clonedElement.appendChild(styleSheet);

              // Apply specific styles needed for PDF
              const pdfStyleSheet = document.createElement("style");
              pdfStyleSheet.appendChild(document.createTextNode(pdfStyles));
              clonedElement.appendChild(pdfStyleSheet);

              document.body.removeChild(iframe);
              resolve(clonedElement);
            }, 5000);
          } catch (error) {
            document.body.removeChild(iframe);
            reject(error);
          }
        };

        iframe.onerror = error => {
          document.body.removeChild(iframe);
          reject(error);
        };

        iframe.src = fullUrl.toString();
      });
    },
    async printProject() {
      // set spinner to button
      let button = this.$refs["kt_dl_project"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_PROJECT_REPORT_PDF, {
          status: this.selected_project_type,
          lang: this.locale === "de" ? "de" : "en"
        });
        if (this.error) {
          throw new Error(this.error);
        }

        const contentWidth = 1150;
        const margins = [30, 0, 45, 0];

        const props = {
          title: "project",
          listName: this.currentLanguage === "de" ? "Liste der Projekte" : "List of projects",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "l",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 85px;
              padding-right: 85px;
              margin-bottom: -10px;
            }

            td div {
              font-size: 13px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            hr {
              border-top: 1px solid #333;
              margin: 5px 0;
            }
          `;
        const htmlElement = await this.getIframeContent(this.project_pdf_code, pdfStyles);

        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_PROJECT);
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async printOffer() {
      // set spinner to button
      let button = this.$refs["kt_dl_offer"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_OFFER_REPORT_PDF, {
          status: this.selected_offer_type,
          lang: this.locale === "de" ? "de" : "en"
        });
        if (this.error) {
          throw new Error(this.error);
        }
        const pdfStyles = `
            .first-page {
              padding-left: 85px;
              padding-right: 85px;
              margin-bottom: -10px;
            }
            td div {
              font-size: 13px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            body {
              display: block;
              color: black;
              line-height: 1.1;
              background-color: #fff;
              font-size: 14px !important;
            }
          `;
        const htmlElement = await this.getIframeContent(this.offer_pdf_code, pdfStyles);

        const contentWidth = 1150;
        const margins = [30, 0, 45, 0];
        const props = {
          title: "offer",
          listName: this.currentLanguage === "de" ? "Liste der Angebote" : "List of offers",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "l",
          lang: this.currentLanguage
        };
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_OFFER);
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async printInvoice() {
      // set spinner to button
      let button = this.$refs["kt_dl_invoice"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_INVOICE_REPORT_PDF, {
          status: this.selected_invoice_type,
          start: this.startdate_status,
          end: this.enddate_status,
          customer: this.selected_invoice_customer,
          lang: this.locale === "de" ? "de" : "en"
        });
        if (this.error) {
          throw new Error(this.error);
        }

        const contentWidth = 1150;
        const margins = [30, 0, 45, 0];
        const urlWithoutHash = this.invoice_pdf_code.replace("#", "");
        const url = new URL(urlWithoutHash, window.location.origin);
        const start = url.searchParams.get("start");
        const end = url.searchParams.get("end");

        const props = {
          title: "invoices",
          listName: this.currentLanguage === "de" ? "Liste der Rechnungen" : "List of invoices",
          subListName: `Zeitraum von ${formatDate(start)} bis ${formatDate(end)}`,
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "l",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 85px;
              padding-right: 85px;
              margin-bottom: 20px;
            }
            td div {
              font-size: 13px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            hr {
              border-top: 1px solid #333;
              margin: 5px 0;
            }
          `;
        const htmlElement = await this.getIframeContent(this.invoice_pdf_code, pdfStyles);

        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_INVOICES, {
          start_date: this.startdate_status,
          end_date: this.enddate_status
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);

        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async printAddressExcel() {
      // set spinner to button
      let button = this.$refs["kt_dl_address_excel"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_ADDRESS_REPORT_EXCEL, {
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        // const download = this.handleDownload(this.address_excel_code);

        const popUp = window.open(this.address_excel_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printProjectExcel() {
      // set spinner to button
      let button = this.$refs["kt_dl_project_excel"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_PROJECT_REPORT_EXCEL, {
        status: this.selected_project_type,
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;

        const popUp = window.open(this.project_excel_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printInvoiceExcel() {
      // set spinner to button
      let button = this.$refs["kt_dl_invoice_excel"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_INVOICE_REPORT_EXCEL, {
        status: this.selected_invoice_type,
        start: this.startdate_status,
        end: this.enddate_status,
        customer: this.selected_invoice_customer,
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;

        const popUp = window.open(this.invoice_excel_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printEffortExternal(item) {
      const id = item.id;
      // set spinner to button
      let button = document.getElementById(`external-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_EFFORT_EXTERNAL_REPORT, {
          id: id,
          start: this.startdate,
          end: this.enddate,
          company_id: this.selected_company,
          lang: this.locale === "de" ? "de" : "en"
        });

        if (this.error) {
          throw new Error(this.error);
        }

        const contentWidth = 1150;
        const margins = [36, 0, 45, 0];

        const props = {
          title: "singleProjectExternal",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand extern nach Aufträgen, Teilleistungen und Honorarkategorien"
              : "External expenses according to orders, partial services and fee categories",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 120px;
              padding-right: 40px;
              margin-bottom: -10px;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.effort_external_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EFFORTS_EXTERNAL, {
          project: item,
          start_date: this.startdate,
          end_date: this.enddate
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async exportEffortExternalXlsx(id) {
      // set spinner to button
      let button = document.getElementById(`external-xlsx-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_EFFORT_EXTERNAL_EXCEL, {
        id: id,
        start: this.startdate,
        end: this.enddate,
        company_id: this.selected_company,
        lang: this.locale === "de" ? "de" : "en"
      });

      button.classList.remove("spinner", "spinner-light", "spinner-right");
      button.disabled = false;

      const popUp = window.open(this.effort_external_excel_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }
    },
    async printEffortExternalWithoutRate(item) {
      const id = item.id;
      // set spinner to button
      let button = document.getElementById(`external-without-rate-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_EFFORT_EXTERNAL_WITHOUT_RATE_REPORT, {
          id: id,
          start: this.startdate,
          end: this.enddate,
          company_id: this.selected_company,
          lang: this.locale === "de" ? "de" : "en"
        });

        if (this.error) {
          throw new Error(this.error);
        }
        const contentWidth = 1150;
        const margins = [36, 0, 45, 0];

        const props = {
          title: "singleProjectExternalWithoutRate",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand extern nach Aufträgen, Teilleistungen und Honorarkategorien"
              : "External expenses according to orders, partial services and fee categories",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 120px;
              padding-right: 60px;
              margin-bottom: -10px;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.effort_external_without_rate_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EFFORTS_EXTERNAL_WITHOUT_RATE, {
          project: item,
          start_date: this.startdate,
          end_date: this.enddate
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async printEffortInternal(item) {
      const id = item.id;
      // set spinner to button
      let button = document.getElementById(`internal-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_EFFORT_INTERNAL_REPORT, {
          id: id,
          start: this.startdate,
          end: this.enddate,
          company_id: this.selected_company,
          lang: this.locale === "de" ? "de" : "en"
        });

        const contentWidth = 1150;
        const margins = [36, 0, 45, 0];

        const props = {
          title: "singleProject",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand intern nach Aufträgen, Teilleistungen und Honorarkategorien"
              : "Internal expenses according to orders, partial services and fee categories",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 120px;
              padding-right: 60px;
              margin-bottom: -10px;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.effort_internal_pdf_code, pdfStyles);

        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EFFORTS_INTERNAL, {
          start_date: this.startdate,
          end_date: this.enddate,
          project: item
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async exportEffortInternalXlsx(id) {
      // set spinner to button
      let button = document.getElementById(`internal-xlsx-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_EFFORT_INTERNAL_EXCEL, {
        id: id,
        start: this.startdate,
        end: this.enddate,
        company_id: this.selected_company,
        lang: this.locale === "de" ? "de" : "en"
      });
      button.classList.remove("spinner", "spinner-light", "spinner-right");
      button.disabled = false;

      const popUp = window.open(this.effort_internal_excel_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }
    },
    async printEffortInternalWithoutRate(item) {
      const id = item.id;
      // set spinner to button
      let button = document.getElementById(`internal-without-rate-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_EFFORT_INTERNAL_WITHOUT_RATE_REPORT, {
          id: id,
          start: this.startdate,
          end: this.enddate,
          company_id: this.selected_company,
          lang: this.locale === "de" ? "de" : "en"
        });

        const contentWidth = 1150;
        const margins = [36, 0, 45, 0];

        const props = {
          title: "singleProjectWithoutRate",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand intern nach Aufträgen, Teilleistungen und Honorarkategorien"
              : "Internal expenses according to orders, partial services and fee categories",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 120px;
              padding-right: 60px;
              margin-bottom: -10px;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.effort_internal_without_rate_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EFFORTS_INTERNAL_WITHOUT_RATE, {
          start_date: this.startdate,
          end_date: this.enddate,
          project: item
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
      // if (this.error) {
      //   button.classList.remove("spinner", "spinner-light", "spinner-right");
      //   button.disabled = false;
      //   this.toastMsg("error", this.error);
      // } else {
      //   button.classList.remove("spinner", "spinner-light", "spinner-right");
      //   button.disabled = false;
      //   const download = this.handleDownload(this.effort_internal_without_rate_pdf_code);

      //   const popUp = window.open(download, "_blank");
      //   if (popUp == null || typeof popUp == "undefined") {
      //     this.toastMsg("error", this.$t("msg.disablePopup"));
      //   } else {
      //     popUp.focus();
      //   }
      // }
    },
    async printProjectByPhases(item) {
      const id = item.id;
      // set spinner to button
      let button = document.getElementById(`project-by-phase-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_PROJECT_BY_PHASES, {
          id: id,
          start: this.startdate,
          end: this.enddate,
          company_id: this.selected_company,
          lang: this.locale === "de" ? "de" : "en"
        });
        const contentWidth = 1150;
        const margins = [36, 0, 45, 0];
        const props = {
          title: "projectPhase",
          listName:
            this.currentLanguage === "de" ? "Aufwand nach Teilleistungen" : "Expenses according to partial services",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              padding-left: 120px;
              padding-right: 60px;
              margin-bottom: -10px;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.project_by_phases_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");
        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_PROJECT_PHASES, {
          project: item,
          start_date: this.startdate,
          end_date: this.enddate
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },

    async printProjectByTasks(item) {
      const id = item.id;
      // set spinner to button
      let button = document.getElementById(`project-by-task-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      try {
        await this.$store.dispatch(EXPORT_PROJECT_BY_TASKS, {
          id: id,
          start: this.startdate,
          end: this.enddate,
          company_id: this.selected_company,
          lang: this.locale === "de" ? "de" : "en"
        });
        const contentWidth = 1150;
        const margins = [36, 0, 45, 0];
        const props = {
          title: "projectTask",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand nach Aufgaben und Mitarbeiteraufgaben"
              : "Expenses according to tasks and employees",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
          .first-page {
            padding-left: 120px;
            padding-right: 60px;
            margin-bottom: -10px;
          }
          td div {
            font-size: 16px;
            page-break-inside: avoid;
            margin: 4px 4px 4px 0px;
          }
        `;
        const htmlElement = await this.getIframeContent(this.project_by_tasks_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");
        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_PROJECT_TASKS, {
          project: item,
          start_date: this.startdate,
          end_date: this.enddate
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },

    async printProjectByAllInvoices(item) {
      const id = item.id;
      // set spinner to button
      let button = document.getElementById(`project-by-invoices-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_PROJECT_BY_ALL_INVOICES, {
        id: id,
        start: this.startdate_summary,
        end: this.enddate_summary,
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;

        const popUp = window.open(this.project_by_invoices_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printProjectByAllInvoicesExcel(id) {
      // set spinner to button
      let button = document.getElementById(`project-by-invoices-xlsx-${id}`);
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_PROJECT_BY_ALL_INVOICES_EXCEL, {
        id: id,
        start: this.startdate_summary,
        end: this.enddate_summary,
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        // const download = this.handleDownload(
        //   this.project_by_invoices_excel_code
        // );

        const popUp = window.open(this.project_by_invoices_excel_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async printAllEffort() {
      let button = document.getElementById("print-all");
      this.print_dialog = !this.print_dialog;
      if (this.currentProjectsWithLog) {
        button.disabled = true;
        this.loading = true;
        for (const item of this.currentProjectsWithLog) {
          await this.printEffortExternal(item.id);
          await this.printEffortInternal(item.id);
        }
      }
      button.disabled = false;
      this.loading = false;
    },
    async printAllEffortWithoutRate() {
      let button = document.getElementById("print-all");
      this.print_without_rate_dialog = !this.print_without_rate_dialog;
      if (this.currentProjectsWithLog) {
        button.disabled = true;
        this.loading = true;
        for (const item of this.currentProjectsWithLog) {
          await this.printEffortExternalWithoutRate(item.id);
          await this.printEffortInternalWithoutRate(item.id);
        }
      }
      button.disabled = false;
      this.loading = false;
    },
    async printHoliday() {
      // set spinner to button
      let button = this.$refs["kt_dl_holiday"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_FLEXIBLE_REPORT, {
          id: this.selected_employee,
          start: this.startdate_flexible,
          end: this.enddate_flexible,
          lang: this.locale === "de" ? "de" : "en"
        });

        if (this.error) {
          throw new Error(this.error);
        }

        const from = moment(this.startdate_flexible).format("DD.MM.YYYY");
        const to = moment(this.enddate_flexible).format("DD.MM.YYYY");
        const contentWidth = 1150;
        const margins = [50, 0, 45, 0];

        const props = {
          title: "listEmployeeFlexible",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand nach Zusammenstellung Gleitzeit- und Feriensaldo"
              : "Expenses according to Flexible time and Holiday",
          subListName: from + " - " + to,
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              margin-left: 7%;
              margin-right: 7%;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.holiday_pdf_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EMPLOYEE_FLEX_AND_HOLIDAYS, {
          start_date: this.startdate_flexible,
          end_date: this.enddate_flexible,
          user: this.employees.find(e => e.id === this.selected_employee) || {}
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    async printHolidayExcel() {
      // set spinner to button
      let button = this.$refs["kt_dl_holiday_excel"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_FLEXIBLE_REPORT_EXCEL, {
        id: this.selected_employee,
        start: this.startdate_flexible,
        end: this.enddate_flexible,
        lang: this.locale === "de" ? "de" : "en"
      });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        const download = this.handleDownload(this.holiday_excel_code);

        const popUp = window.open(download, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    printEffortByPhase() {},
    printEffortByPhaseExcel() {},
    printEffortByTaskExcel() {},
    async printUserEffort() {
      // set spinner to button
      let button = this.$refs["kt_dl_effort"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;
      try {
        await this.$store.dispatch(EXPORT_EFFORT_REPORT, {
          id: this.selected_employee,
          start: this.startdate_flexible,
          end: this.enddate_flexible,
          lang: this.locale === "de" ? "de" : "en"
        });
        if (this.error) {
          throw new Error(this.error);
        }

        const contentWidth = 1150;
        const margins = [30, 0, 45, 0];

        const props = {
          title: "listEmployeeEffort",
          listName:
            this.currentLanguage === "de"
              ? "Aufwand nach Mitarbeitern und Aufträgen"
              : "Employee expenses according to orders",
          company: this.currentCompany.name,
          companyAddress: this.currentSettings.master_data.address,
          date: moment().format("DD.MM.YYYY"),
          orientation: "p",
          lang: this.currentLanguage
        };
        const pdfStyles = `
            .first-page {
              margin-left: 7%;
              margin-right: 7%;
            }
            td div {
              font-size: 16px;
              page-break-inside: avoid;
              margin: 4px 4px 4px 0px;
            }
            `;
        const htmlElement = await this.getIframeContent(this.user_effort_code, pdfStyles);
        const newWindow = window.open("", "_blank");
        if (!newWindow) {
          throw new Error(this.$t("msg.disablePopup"));
        }
        newWindow.document.write("Loading PDF...");

        // Generate PDF
        const pdfBlob = await generateHTMLToPDF(htmlElement, contentWidth, margins, props);
        const fileName = generateExportFileName(ReportExportCode.REPORT_EMPLOYEE_EFFORT, {
          start_date: this.startdate_flexible,
          end_date: this.enddate_flexible,
          user: this.employees.find(e => e.id === this.selected_employee) || {}
        });
        saveAs(pdfBlob, fileName);
        newWindow.close();
      } catch (error) {
        console.error("Error generating PDF:", error);
        this.toastMsg("error", error.message || this.error);
      } finally {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
      }
    },
    printUserEffortExcel() {},
    openPreviewExternal(id) {
      window
        .open(
          `#/report/list-effort-external/${id}?start=${this.startdate}&end=${this.enddate}&company_id=${
            this.selected_company
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    openPreviewExternalWithoutRate(id) {
      window
        .open(
          `#/report/list-effort-external-without-rate/${id}?start=${this.startdate}&end=${this.enddate}&company_id=${
            this.selected_company
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    openPreviewInternal(id) {
      window
        .open(
          `#/report/list-effort-internal/${id}?start=${this.startdate}&end=${this.enddate}&company_id=${
            this.selected_company
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    openPreviewInternalWithoutRate(id) {
      window
        .open(
          `#/report/list-effort-internal-without-rate/${id}?start=${this.startdate}&end=${this.enddate}&company_id=${
            this.selected_company
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    openPreviewHoliday() {
      window
        .open(
          `#/report/list-flexible-and-holiday/${this.selected_employee}?start=${this.startdate_flexible}&end=${
            this.enddate_flexible
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    openPreviewEffortByPhase(id) {
      window
        .open(
          `#/report/list-effort-by-phase/${id}?start=${this.startdate}&end=${this.enddate}&company_id=${
            this.selected_company
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    openPreviewEffortByTask(id) {
      window
        .open(
          `#/report/list-effort-by-task/${id}?start=${this.startdate}&end=${this.enddate}&company_id=${
            this.selected_company
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    openPreviewEffortByAllInvoices(id) {
      window.open(`#/report/project-with-invoices/${id}?lang=${this.locale === "de" ? "de" : "en"}`, "_blank").focus();
    },
    openPreviewUserEffort() {
      window
        .open(
          `#/report/list-user-effort/${this.selected_employee}?start=${this.startdate_flexible}&end=${
            this.enddate_flexible
          }&lang=${this.locale === "de" ? "de" : "en"}`,
          "_blank"
        )
        .focus();
    },
    formatDate() {
      if (this.startdate) {
        this.startdate_formatted = formatDate(this.startdate);
      }
      if (this.enddate) {
        this.enddate_formatted = formatDate(this.enddate);
      }
    },
    formatStatusDate() {
      if (this.startdate_status) {
        this.startdate_status_formatted = formatDate(this.startdate_status);
      }
      if (this.enddate_status) {
        this.enddate_status_formatted = formatDate(this.enddate_status);
      }
    },
    formatFlexibleDate() {
      if (this.startdate_flexible) {
        this.startdate_flexible_formatted = formatDate(this.startdate_flexible);
      }
      if (this.enddate_flexible) {
        this.enddate_flexible_formatted = formatDate(this.enddate_flexible);
      }
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },
    toastMsg(type, msg) {
      const h = this.$createElement;
      this.count++;
      const vNodesTitle = h("div", { class: ["d-flex", "flex-grow-1", "align-items-baseline", "mr-2"] }, [
        h("strong", { class: "mr-2" }, type === "error" ? "Error" : this.$t("title.notice"))
      ]);
      const vNodesMsg = h("h5", { class: ["mb-0"] }, [h("strong", msg)]);
      this.$bvToast.toast([vNodesMsg], {
        title: vNodesTitle,
        variant: type === "error" ? "danger" : "success",
        toaster: "b-toaster-top-center",
        autoHideDelay: 5000,
        solid: true
      });
      this.$store.commit(SET_REPORT_ERROR, null);
    }
  }
};
</script>

<style scoped>
.action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.filter-badge {
  opacity: 0.5;
  cursor: pointer;
}

.active {
  opacity: 1;
}
</style>
