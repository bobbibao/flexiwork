<script lang="ts">
import ProjectDetail from "./ProjectDetail";
export default ProjectDetail;
</script>

<template>
  <div class="flexiwork-wrapper bg-white rounded-lg border border-secondary w-100 overflow-auto position-relative">
    <div class="py-6 px-8 mb-0 sticky bg-white top-0 z-10 top-section gap-1">
      <div class="flexiwork-project-detail">
        <div class="sticky-action-bar">
          <div class="action-bar d-flex justify-content-between">
            <div class="d-flex">
              <ButtonCustom
                :text="$t('button.back')"
                size="sm"
                @click="goTo('/project')"
                variant="secondary-gray"
                customClass="back-button"
              >
                <template #start-icon>
                  <ChevronLeft :width="20" :height="20" />
                </template>
              </ButtonCustom>
            </div>
            <div class="action-buttons">
              <div v-if="!!projectId" class="update-buttons-bar d-flex flex-row gap-2">
                <ButtonCustom
                  v-b-modal="'Delete-' + projectId"
                  :text="$t('button.delete')"
                  size="sm"
                  variant="link-gray"
                  :disabled="originalProject?.status === 'deleted' || loadingDelete"
                  :loading="loadingDelete"
                  class="button-custom-style"
                >
                  <template #start-icon>
                    <Trash2 :width="20" :height="20" />
                    <ConfirmModal
                      :modal-id="'Delete-' + projectId"
                      :header="$t('title.deleteProject')"
                      :body="$t('msg.delProject') + ' ' + currentCompany.name + '?'"
                      @confirm="!!$event && handleDeleteProject()"
                    />
                  </template>
                </ButtonCustom>
                <ButtonCustom
                  :text="$t('button.previewPdf')"
                  size="sm"
                  variant="link-gray"
                  @click="handlePreviewPdf"
                  :disabled="loadingPreview"
                  :loading="loadingPreview"
                  class="button-custom-style"
                >
                  <template #start-icon>
                    <Eye :width="30" :height="30" />
                  </template>
                </ButtonCustom>
                <b-dropdown size="md" variant="link-gray" class="button-custom-style">
                  <template #button-content>
                    <div style="font-size: 14px; font-weight: 500;">{{ $t("button.more") }}</div>
                  </template>
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handleCopyProject"
                    :disabled="loadingCopy"
                    >{{ $t("button.copy") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handleCopyProjectAsOffer"
                    :disabled="loadingCopyOffer"
                    >{{ $t("button.copyAsOffer") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handleSendMail"
                    :disabled="loadingMail"
                    >{{ $t("button.mail") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handlePrintPdf"
                    :disabled="loadingPrint"
                    >{{ $t("button.printpdf") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handlePrintDocx"
                    :disabled="loadingDoc"
                    >{{ $t("button.printdocx") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="openInvoiceConfirmModal"
                    :disabled="loadingDoc"
                    >{{ $t("button.invoice") }}</b-dropdown-item
                  >
                </b-dropdown>
                <ButtonCustom
                  :text="$t('button.save')"
                  size="sm"
                  @click="handleSubmit"
                  :disabled="!allowSubmit() || isSaving"
                  :loading="isSaving"
                />
              </div>
              <div v-else class="create-button-bar d-flex">
                <ButtonCustom
                  :text="$t('button.create')"
                  size="sm"
                  @click="handleSubmit"
                  :disabled="isSaving"
                  :loading="isSaving"
                >
                  <template #start-icon></template>
                </ButtonCustom>
              </div>
            </div>
          </div>
        </div>
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <div v-else class="project-detail">
          <form class="project-form" @submit.prevent="handleSubmit" :class="{ 'pointer-events-none': isSaving }">
            <div class="require-block">
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("project.customer") }}
                </div>
                <div class="col-6 px-0">
                  <div
                    @click="openCustomerSelector"
                    class="select-customer-input w-100 d-flex justify-content-between"
                    :class="{ disabled: checkArchived() }"
                  >
                    <slot name="title">
                      <div style="text-overflow: ellipsis;">
                        {{
                          currentProject.customer?.company
                            ? currentProject.customer.company
                            : currentProject.customer?.first_name || currentProject.customer?.last_name
                            ? `${currentProject.customer.first_name || ""}, ${currentProject.customer.last_name || ""}`
                            : currentProject.customer?.details?.company
                            ? currentProject.customer.details.company
                            : currentProject.customer?.details?.first_name ||
                              currentProject.customer?.details?.last_name
                            ? `${currentProject.customer.details.first_name || ""}, ${currentProject.customer.details
                                .last_name || ""}`
                            : currentProject.customer?.details?.address || $t("button.selectCustomer")
                        }}
                      </div>
                    </slot>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="#667085"
                        stroke-width="1.66667"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  Project Nr.
                </div>
                <div class="col-6 px-0">
                  <b-form-input
                    id="projectNumber"
                    v-model="currentProject.number"
                    :placeholder="$t('project.enterNumber')"
                    :disabled="checkArchived()"
                  />
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("project.project") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-input
                    id="projectTitle"
                    v-model="currentProject.name"
                    :state="validation.name.touched ? validation.name.valid : null"
                    aria-describedby="project-title"
                    :placeholder="$t('project.enterProject')"
                    :disabled="checkArchived()"
                    required
                    @blur="validateField('name', currentProject.name)"
                  />
                  <b-form-invalid-feedback id="project-title" v-if="!validation.name.valid">
                    {{ validation.name.message }}
                  </b-form-invalid-feedback>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("project.location") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-input
                    id="projectLocation"
                    v-model="currentProject.location"
                    :placeholder="$t('project.enterLocation')"
                    :state="validation.location.touched ? validation.location.valid : null"
                    :disabled="checkArchived()"
                    @blur="validateField('location', currentProject.location)"
                    aria-describedby="project-location"
                  ></b-form-input>

                  <b-form-invalid-feedback id="project-location" v-if="!validation.location.valid">
                    {{ validation.location.message }}
                  </b-form-invalid-feedback>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("project.assignee") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-select
                    id="projectAssignee"
                    v-model="currentProject.assignee_id"
                    :options="currentUsers"
                    value-field="id"
                    text-field="email"
                    :disabled="checkArchived()"
                  ></b-form-select>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("project.date") }}
                </div>
                <div class="col-6 px-0">
                  <b-input-group>
                    <b-form-input
                      v-model="currentProject.date_formatted"
                      type="text"
                      autocomplete="off"
                      :disabled="checkArchived()"
                      placeholder="dd.mm.yyyy"
                      readonly
                      :style="checkArchived() ? 'background-color: #f3f6f9 !important;' : ''"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-form-datepicker
                        v-model="currentProject.date"
                        :locale="locale"
                        :start-weekday="1"
                        button-only
                        right
                        :disabled="checkArchived()"
                        @context="formatDate"
                      ></b-form-datepicker>
                    </b-input-group-append>
                  </b-input-group>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("project.completion") }}
                </div>
                <div class="col-6 px-0">
                  <b-input-group>
                    <b-form-input
                      v-model="currentProject.end_on_formatted"
                      type="text"
                      autocomplete="off"
                      :disabled="checkArchived()"
                      placeholder="dd.mm.yyyy"
                      readonly
                      :style="checkArchived() ? 'background-color: #f3f6f9 !important;' : ''"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-form-datepicker
                        v-model="currentProject.end_on"
                        :locale="locale"
                        :start-weekday="1"
                        button-only
                        right
                        :disabled="checkArchived()"
                        @context="formatEndDate"
                      ></b-form-datepicker>
                    </b-input-group-append>
                  </b-input-group>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("project.hourRate") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-input
                    id="projectRatePerHour"
                    v-model="currentProject.rate_per_hour"
                    type="number"
                    :disabled="checkArchived()"
                  />
                </div>
              </div>
              <div class="input-container" v-if="currentCompany.allow_to_use_other_currencies">
                <div class="input-label col-4 p-0">
                  {{ $t("settings.form.master.currency") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-select
                    v-model="currentProject.currency_val"
                    :options="currentCompany.currencies || []"
                    :disabled="checkArchived()"
                  ></b-form-select>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  Anschrift
                </div>
                <div class="col-6 px-0">
                  <ContentEditor v-model="currentProject.address" :disabled="checkArchived()" />
                </div>
              </div>
            </div>

            <!-- Quote Item & Additional Cost section -->
            <div class="optional-container">
              <Accordion name="services-and-additional-cost" :expanded="true">
                <template #title>
                  <EditableTitle
                    :value="currentProject.begin || '1. Rahmenbedingungen'"
                    :disabled="checkArchived()"
                    @update="currentProject.begin = $event"
                  />
                </template>
                <template #body>
                  <ContentEditor v-model="currentProject.begin_desc" :disabled="checkArchived()" />
                  <div class="d-flex flex-row gap-2">
                    <input
                      id="begin_break"
                      type="checkbox"
                      v-model="currentProject.begin_break"
                      :disabled="checkArchived()"
                      :checked="currentProject.begin_break"
                      class="cursor-pointer"
                    />
                    <label for="begin_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>
                  <QuoteItems
                    :currency="currentProject.currency_val"
                    :quoteItems="currentProject.quote_items"
                    :disabled="checkArchived()"
                    :additionalCost="additionalCost"
                    :discountPercent="currentProject.discount_percent"
                    :invoiceList="currentProject.invoices"
                    @update:quoteItems="updateQuoteItems"
                    @update:discountPercent="currentProject.discount_percent = $event"
                  />
                  <div class="d-flex flex-row gap-2">
                    <input
                      id="offer-quote_break"
                      type="checkbox"
                      :checked="currentProject.offer_quote_break"
                      :disabled="checkArchived()"
                      v-model="currentProject.offer_quote_break"
                      class="cursor-pointer"
                    />
                    <label for="offer-quote_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>

                  <!-- Divider -->
                  <div class="divider my-3"></div>

                  <div class="internal-desc-container">
                    <AdditionalCosts
                      :showAdditionalDesc="false"
                      :selected_km_label="selected_km_label"
                      :defaultKmOptions="defaultKmOptions"
                      :defaultAdditionalOptions="defaultAdditionalOptions"
                      @addQuoteItem="addQuoteItem"
                      @update:selected_km_label="selected_km_label = $event"
                      :disabled="checkArchived()"
                    />
                    <div class="d-flex flex-row gap-2" @click="() => {}">
                      <input
                        id="additional_break"
                        type="checkbox"
                        :checked="currentProject.additional_break"
                        :disabled="checkArchived()"
                        v-model="currentProject.additional_break"
                        class="cursor-pointer"
                      />
                      <label for="additional_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                    </div>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- End Description section -->
            <div class="optional-container">
              <Accordion name="end-description" :expanded="true">
                <template #title>
                  <EditableTitle
                    :value="currentProject.end || '2. Ende des Textes'"
                    :disabled="checkArchived()"
                    @update="currentProject.end = $event"
                  />
                </template>
                <template #body>
                  <ContentEditor v-model="currentProject.end_desc" :disabled="checkArchived()" />
                  <InternalDesc :internalDesc.sync="currentProject.internal_desc" :disabled="checkArchived()" />
                  <b-form-textarea
                    style="border: 1px solid #e4e7ec; border-radius: 8px; padding: 10px 14px;"
                    :placeholder="$t('project.enterDescription')"
                    v-model="currentProject.internal_desc_custom"
                    :disabled="checkArchived()"
                  ></b-form-textarea>
                  <div class="d-flex">
                    <input
                      type="checkbox"
                      id="is_internal"
                      v-model="currentProject.is_internal"
                      :disabled="checkArchived()"
                      class="cursor-pointer"
                    />
                    <label
                      for="is_internal"
                      class="ml-2 mb-0"
                      style="font-weight: 500; font-size: 14px; line-height: 20px; color: #344054;"
                    >
                      {{ $t("button.internal") }}
                    </label>
                  </div>
                  <div class="d-flex">
                    <input
                      type="checkbox"
                      id="only_my_company"
                      v-model="currentProject.only_my_company"
                      :disabled="checkArchived()"
                      class="cursor-pointer"
                    />
                    <label
                      for="only_my_company"
                      class="ml-2 mb-0"
                      style="font-weight: 500; font-size: 14px; line-height: 20px; color: #344054;"
                    >
                      {{ $t("button.myCompanyOnly") }}
                    </label>
                  </div>
                </template>
              </Accordion>
            </div>
          </form>
        </div>
      </div>
    </div>

    <CustomerSelector
      :dialog="customerDialogVisible"
      :searchQuery="searchQuery"
      :filteredCustomers="filteredCustomers"
      :selectedCustomer="selectedCustomer"
      @update:searchQuery="updateSearchQuery"
      @selectCustomer="selectCustomer"
      @cancel="cancelCustomerSelection"
      @confirm="confirmCustomerSelection"
    />

    <!-- Only mount this component when is editing a project -->
    <InvConfirmModal
      v-if="!!parseInt(projectId)"
      :dialog="invConfirmModalVisible"
      :projectProducts="currentProject.quote_items"
      :projectId="parseInt(projectId)"
      :currentProject="currentProject"
      :detailCost="detailCostData"
      :remainingNet="remainingNetAmount"
      :additionalTotal="additionalTotalAmount"
      :additionalPercent="currentProject.additional_percent || 0"
      :discountPercent="currentProject.discount_percent ? currentProject.discount_percent : 0"
      @cancel="closeInvoiceConfirmModal"
      @invoice-confirmed="handleCreateInvoice"
    />
  </div>
</template>

<style lang="scss" scoped>
@import "./ProjectDetail.scss";
</style>
