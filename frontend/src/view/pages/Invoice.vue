<template>
  <div>
    <div class="invoice-overview-wrapper">
      <div class="card card-custom bg-white card-stretch gutter-b p-10 invoice-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.sumInvoice") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ invoicesStats.total_open_invoices }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 invoice-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.notCharged") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ invoicesStats.total_offset_invoices }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 invoice-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.reminder") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ invoicesStats.total_reminder_invoices }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 invoice-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.totalOutstandingNetAmount") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ formatMoney(invoicesStats.total_open_net_amount) }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 invoice-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.totalOutstandingGrossAmount") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ formatMoney(invoicesStats.total_open_gross_amount) }}
        </div>
      </div>
    </div>

    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-8 p-0 action-start">
          <h3 class="m-0 mr-4">{{ $t("menu.invoices") }}</h3>
          <b-badge
            class="filter-badge"
            :class="{ active: status === 'all' }"
            variant="primary"
            @click="filterStatus('all')"
          >
            <div class="text-capitalize">
              {{ $t("status.all") }}
            </div>
          </b-badge>
          <div v-for="(item, i) in statusOptions" :key="i" class="ml-2">
            <b-badge
              v-if="item.value === 'offset'"
              class="filter-badge"
              :class="{ active: status === 'offset' }"
              @click="filterStatus(item.value)"
            >
              <div class="text-capitalize">
                {{ item.label }}
              </div>
            </b-badge>
            <b-badge
              v-if="item.value === 'open'"
              class="filter-badge"
              :class="{ active: status === 'open' }"
              variant="info"
              @click="filterStatus(item.value)"
            >
              <div class="text-capitalize">
                {{ item.label }}
              </div>
            </b-badge>
            <b-badge
              v-else-if="item.value === 'paid'"
              class="filter-badge"
              :class="{ active: status === 'paid' }"
              variant="success"
              @click="filterStatus(item.value)"
            >
              <div class="text-capitalize">
                {{ item.label }}
              </div>
            </b-badge>
            <b-badge
              v-else-if="item.value === 'cancelled'"
              class="filter-badge"
              :class="{ active: status === 'cancelled' }"
              variant="danger"
              @click="filterStatus(item.value)"
            >
              <div class="text-capitalize">
                {{ item.label }}
              </div>
            </b-badge>
            <b-badge
              v-else-if="item.value === 'reminder1'"
              class="filter-badge"
              :class="{ active: status === 'reminder1' }"
              variant="warning"
              @click="filterStatus(item.value)"
            >
              <div class="text-capitalize">
                {{ item.label }}
              </div>
            </b-badge>
            <b-badge
              v-else-if="item.value === 'reminder2'"
              class="filter-badge"
              :class="{ active: status === 'reminder2' }"
              variant="warning"
              @click="filterStatus(item.value)"
            >
              <div class="text-capitalize">
                {{ item.label }}
              </div>
            </b-badge>
          </div>
        </div>
        <!-- Actions -->
        <div class="col-md-4 p-0 action">
          <b-button variant="primary" size="lg" class="add-btn" @click="goTo('/invoice/create')">
            <i class="menu-icon flaticon2-plus-1"></i>
            <span class="menu-text"> {{ $t("button.add") }} </span>
          </b-button>
        </div>
      </div>

      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <!-- Search -->
        <div class="row mb-4">
          <div class="col-md-3 action-start">
            <span class="mr-2">{{ $t("button.show") }}</span>
            <b-form-select v-model="perPage" id="perPageSelect" size="sm" :options="pageOptions"></b-form-select>
            <span class="ml-2">{{ $t("button.entries") }}</span>
          </div>
          <div class="col-md-9 action">
            <span class="mr-2">{{ $t("button.search") }}:</span>
            <b-form-input v-model="filter" type="search" id="filterInput"></b-form-input>
            <div v-b-tooltip.hover title="Bulk update status">
              <b-button class="ml-2" @click="toggleUpdate" :disabled="selectedInvoices.length === 0">
                <i class="flaticon2-sheet"></i>
              </b-button>
            </div>
            <div v-b-tooltip.hover title="Clear selected invoices">
              <b-button class="ml-2" @click="clearSelected" :disabled="selectedInvoices.length === 0">
                <i class="flaticon2-refresh"></i>
              </b-button>
            </div>
          </div>
        </div>
        <!-- Data Table -->
        <b-table
          ref="selectableTable"
          bordered
          head-variant="light"
          :items="invoices"
          :fields="fields"
          :current-page="currentPage"
          :per-page="perPage"
          :filter-included-fields="filterIncludedFields"
          :filter="filter"
          :busy="loading"
          :sort-compare="mySortCompare"
          selectable
          select-mode="multi"
          @filtered="onFiltered"
          @row-selected="onRowSelected"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>

          <template #cell(customer)="row">
            {{ row.value }}
          </template>

          <template v-slot:cell(name)="row">
            <div class="note-container">
              <button
                v-if="row.item.internal_desc_custom"
                class="note-badge"
                data-toggle="tooltip"
                data-html="true"
                :title="row.item.internal_desc_custom"
              ></button>
              <div class="name-cell" @click.stop="goTo(`/invoice/${row.item.id}`)">
                {{ row.item.name + ", " + row.item.location }}
              </div>
            </div>
          </template>

          <template v-slot:cell(number)="row">
            {{ row.item.number.custom_id ? row.item.number.custom_id : row.item.number.id }}
          </template>

          <template v-slot:cell(due_on)="row">
            <div :class="row.item.overdue ? 'text-danger' : null">
              {{ row.item.due_on }}
            </div>
          </template>

          <template v-slot:cell(status)="row">
            <b-badge :variant="renderStatusStyle(row.item.status)">
              <div class="text-capitalize">
                {{ row.item.status }}
              </div>
            </b-badge>
          </template>

          <template v-slot:cell(actions)="row">
            <i
              :id="`print-${row.item.id}`"
              class="action-icon flaticon2-printer mr-2"
              @click.stop="print(row.item)"
              v-b-tooltip.hover
              title="Export PDF"
            ></i>
            <i
              class="action-icon flaticon2-checking mr-2"
              @click.stop="duplicateInvoice(row.item)"
              v-b-tooltip.hover
              title="Duplicate"
            ></i>
            <i
              class="action-icon flaticon2-rubbish-bin"
              @click.stop="remove(row.item)"
              v-b-tooltip.hover
              title="Delete"
            ></i>
          </template>
        </b-table>
        <!-- Pagination -->
        <div class="row action">
          <div class="col-md-3">
            <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="perPage"
              align="fill"
              size="md"
              class="my-0"
            ></b-pagination>
          </div>
        </div>
      </div>
    </div>

    <!-- Remove Dialog -->
    <b-modal v-model="remove_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delInvoice") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove" :disabled="loading">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Update Dialog -->
    <b-modal v-model="update_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.updateStatus')}`">
      <div>
        {{ $t("msg.updateStatus") }}
      </div>
      <div class="mt-2">
        <b-form-select
          v-model="update_status"
          :options="statusOptions"
          text-field="label"
          value-field="value"
        ></b-form-select>
      </div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmUpdate" :disabled="loading">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import currency from "currency.js";
import moment from "moment";
import { mapGetters, mapState } from "vuex";
import i18nService from "@/core/services/i18n.service.js";
import {
  GET_INVOICES,
  DELETE_INVOICE,
  COPY_INVOICE,
  SET_INVOICE_TOAST,
  FILTER_INVOICE,
  EXPORT_INVOICE_PDF,
  UPDATE_INVOICE_STATUS,
  GET_INVOICES_STATS
} from "@/core/services/store/invoice";
import { formatDate } from "@/common";

export default {
  name: "invoice",
  metaInfo: {
    title: "Invoice",
    meta: [
      { hid: "description", name: "description", content: "Invoice Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Invoice | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Invoice | Archapp"
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
      fields: [
        {
          key: "customer",
          label: this.$t("invoice.name"),
          sortable: true,
          thStyle: { width: "10%" },
          formatter: "renderName"
        },
        {
          key: "number",
          label: this.$t("invoice.number"),
          sortable: true,
          thStyle: { width: "5%" }
        },
        {
          key: "name",
          label: this.$t("invoice.title"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "metadata.slip_number",
          label: this.$t("invoice.qr"),
          sortable: true,
          thStyle: { width: "5%" }
        },
        {
          key: "charged_on",
          label: this.$t("invoice.charged"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "due_on",
          label: this.$t("invoice.due"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "paid_on",
          label: this.$t("invoice.paid"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "total_net",
          label: this.$t("invoice.amountNet"),
          formatter: "formatMoney",
          thStyle: { width: "10%" },
          filterByFormatted: false
        },
        {
          key: "total_gross",
          label: this.$t("invoice.amount"),
          formatter: "formatMoney",
          thStyle: { width: "10%" },
          filterByFormatted: false
        },
        {
          key: "status",
          label: "Status",
          sortable: true,
          thStyle: { width: "5%" }
        },
        {
          key: "actions",
          label: this.$t("invoice.actions"),
          thStyle: { width: "5%" }
        },
        {
          key: "metadata.slip_number",
          thClass: "d-none",
          tdClass: "d-none"
        }
      ],
      totalRows: 1,
      currentPage: 1,
      perPage: 20,
      pageOptions: [20, 40, 60],
      status: "open",
      statusOptions: [
        { value: "offset", label: this.$t("status.offset") },
        { value: "open", label: this.$t("status.open") },
        { value: "paid", label: this.$t("status.paid") },
        { value: "cancelled", label: this.$t("status.cancelled") },
        { value: "reminder1", label: this.$t("status.reminder1") },
        { value: "reminder2", label: this.$t("status.reminder2") },
        { value: "archive", label: this.$t("status.archive") }
      ],
      filter: null,
      remove_dialog: false,
      update_dialog: false,
      loading: true,
      delete_id: 0,
      update_status: "",
      selectedInvoices: [],
      filterIncludedFields: [
        "customer",
        "number",
        "name",
        "charged_on",
        "due_on",
        "status",
        "slip_number",
        "total_net",
        "total_gross"
      ]
    };
  },
  computed: {
    ...mapGetters(["currentInvoices", "currentCompany", "invoicesStats"]),
    ...mapState({
      error: state => state.invoice.error,
      toast: state => state.invoice.toast,
      pdf_code: state => state.invoice.pdf
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    invoices() {
      let arr = [];
      for (const item of this.currentInvoices) {
        if (item.charged_on) {
          item.charged_on = formatDate(item.charged_on);
        }
        if (item.due_on) {
          if (this.checkOverdue(item.due_on)) {
            item["overdue"] = true;
          } else {
            item["overdue"] = false;
          }
          item.due_on = formatDate(item.due_on);
        }
        if (item.paid_on) {
          item.paid_on = formatDate(item.paid_on);
        }
        item.status_origin = item.status;
        item.total_gross = item.detail_cost.total_gross + item.detail_cost.total_gross_nk;
        item.total_net = item.detail_cost.total_net + item.detail_cost.total_net_nk;
        item.status = this.renderStatus(item.status);
        arr.push(item);
      }
      return arr;
    }
  },
  async mounted() {
    if (this.toast) {
      await this.toastMsg(this.toast.type, this.toast.msg);
      this.$store.commit(SET_INVOICE_TOAST, null);
    }
    await this.$store.dispatch(FILTER_INVOICE, { filter: this.status ?? "all" });
    this.totalRows = this.currentInvoices.length;
    await this.$store.dispatch(GET_INVOICES_STATS);
    this.checkOverdue();
    this.loading = !this.loading;
  },
  methods: {
    formatDate,
    async duplicateInvoice(item) {
      this.loading = !this.loading;
      await this.$store.dispatch(COPY_INVOICE, { id: item.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.copySuccess"));
        await this.$store.dispatch(FILTER_INVOICE, { filter: this.status });
      }
      this.loading = !this.loading;
    },
    renderName(item) {
      if (item.type == "company") {
        return item.name;
      } else {
        return item.first_name + ", " + item.last_name;
      }
    },
    renderStatus(item) {
      if (item === "open") {
        return this.$t("status.open");
      } else if (item === "cancelled") {
        return this.$t("status.cancelled");
      } else if (item === "paid") {
        return this.$t("status.paid");
      } else if (item === "deleted") {
        return this.$t("status.deleted");
      } else if (item === "reminder1") {
        return this.$t("status.reminder1");
      } else if (item === "reminder2") {
        return this.$t("status.reminder2");
      } else if (item === "offset") {
        return this.$t("status.offset");
      }
    },
    renderStatusStyle(item) {
      if (item === this.$t("status.open")) {
        return "info";
      } else if (item === this.$t("status.paid")) {
        return "success";
      } else if (item === this.$t("status.cancelled")) {
        return "danger";
      } else if (item === this.$t("status.reminder1") || item === this.$t("status.reminder2")) {
        return "warning";
      } else {
        return null;
      }
    },
    async print(item) {
      // set spinner to button
      const button = document.getElementById(`print-${item.id}`);
      button.classList.remove("flaticon2-printer");
      button.classList.add("flaticon2-hourglass-1");
      button.setAttribute("style", "pointer-events:none;color:#1BC5BD");

      await this.$store.dispatch(EXPORT_INVOICE_PDF, {
        id: item.id,
        lang: this.currentLanguage === "de" ? "de" : "en"
      });

      // update new logic
      button.classList.remove("flaticon2-hourglass-1");
      button.classList.add("flaticon2-printer");
      button.removeAttribute("style");

      const popUp = window.open(this.pdf_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }

      // if (this.error) {
      //   button.classList.remove("flaticon2-hourglass-1");
      //   button.classList.add("flaticon2-printer");
      //   button.removeAttribute("style");
      //   this.toastMsg("error", this.error);
      // } else {
      //   button.classList.remove("flaticon2-hourglass-1");
      //   button.classList.add("flaticon2-printer");
      //   button.removeAttribute("style");
      //   const download = this.handleDownload(this.pdf_code);

      //   const popUp = window.open(download, "_blank");
      //   if (popUp == null || typeof popUp == "undefined") {
      //     this.toastMsg("error", this.$t("msg.disablePopup"));
      //   } else {
      //     popUp.focus();
      //   }
      // }
    },
    remove(item) {
      this.delete_id = item.id;
      this.remove_dialog = true;
    },
    async confirmRemove() {
      this.loading = true;
      await this.$store.dispatch(DELETE_INVOICE, { id: this.delete_id });
      this.remove_dialog = false;
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.delSuccess"));
        await this.$store.dispatch(FILTER_INVOICE, { filter: this.status });
      }
      this.loading = false;
    },
    goTo(name) {
      this.$router.push(name);
    },

    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    formatTotal(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`
      }).format();
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
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },
    async filterStatus(filter) {
      this.loading = !this.loading;
      this.status = filter;
      if (filter === "all") {
        await this.$store.dispatch(GET_INVOICES);
      } else {
        await this.$store.dispatch(FILTER_INVOICE, { filter: filter });
      }
      // Update pagination after filtered
      this.onFiltered(this.currentInvoices);
      this.loading = !this.loading;
    },
    checkOverdue(val) {
      const today = moment();
      const date = moment(val);
      const diff = today.diff(date, "days");
      if (diff > 0) {
        return true;
      } else {
        return false;
      }
    },
    toggleUpdate() {
      this.update_status = this.statusOptions[0].value;
      this.update_dialog = !this.update_dialog;
    },
    async confirmUpdate() {
      this.loading = !this.loading;
      await this.$store.dispatch(UPDATE_INVOICE_STATUS, {
        data: {
          id: this.selectedInvoices,
          status: this.update_status
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(FILTER_INVOICE, { filter: this.status });
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        this.update_dialog = !this.update_dialog;
      }
      this.loading = !this.loading;
    },
    onRowSelected(items) {
      this.selectedInvoices = items;
    },
    clearSelected() {
      this.$refs.selectableTable.clearSelected();
    },
    mySortCompare(a, b, key) {
      if (key === "due_on" || key === "charged_on") {
        const aDate = moment(a[key], "DD/MM/YYYY");
        const bDate = moment(b[key], "DD/MM/YYYY");
        return aDate - bDate;
      } else {
        return false;
      }
    }
  }
};
</script>

<style scoped>
.action-icon:hover,
.name-cell:hover {
  color: #3699ff;
}

.action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.action-start {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

#perPageSelect {
  width: 25%;
}

#filterInput {
  width: 35%;
}

.spacer {
  height: 1px;
  background-color: #999999;
  opacity: 30%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.filter-badge {
  opacity: 0.5;
  cursor: pointer;
}

.active {
  opacity: 1;
}

.name-cell {
  cursor: pointer;
  text-decoration: underline;
}

.note-container {
  position: relative;
  padding-right: 20px;
}

.note-badge {
  position: absolute;
  right: 0;
  height: 10px;
  width: 10px;
  background-color: #f64e60;
  border-radius: 50%;
}

.invoice-overview-wrapper {
  width: 100%;
  display: inline-flex;
  justify-content: space-evenly;
}

.invoice-overview-card {
  width: 100%;
  margin-right: 2rem;
}

.invoice-overview-card:last-child {
  margin-right: 0;
}

.overview-header {
  color: #929292;
}
</style>
