<template>
  <div>
    <div class="card card-custom bg-white gutter-b">
      <div class="card-body p-0 position-relative overflow-hidden rounded-xl">
        <h3 class="font-weight-bolder py-8 px-6">
          {{ $t("title.overview") }}
        </h3>
        <div v-if="loading" class="text-center text-danger my-2 mb-10">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <div v-else class="card-spacer mt-10">
          <!-- Offer -->
          <div class="row m-0">
            <h6 class="status font-weight-bold text-primary">
              {{ $t("dashboard.activeOffer") }}
              <!-- ({{ $t("dashboard.sumNet") }}: {{ currency }}
              {{ formatMoney(totalOffer.sum_net) }} -
              {{ $t("dashboard.sumGross") }}: {{ currency }}
              {{ formatMoney(totalOffer.sum_gross) }}) -->
              ({{ $t("dashboard.totalOfferNetAmount") }}: {{ currency }}
              {{ formatMoney(currentSummary.total_offer_net_amount) }} - {{ $t("dashboard.totalOfferGrossAmount") }}:
              {{ currency }} {{ formatMoney(currentSummary.total_offer_gross_amount) }})
            </h6>
          </div>
          <b-table
            bordered
            hover
            selectable
            head-variant="light"
            :items="currentSummary.offers"
            :fields="offer_fields"
            @row-clicked="selectOffer"
          >
            <template v-slot:cell(date)="row">
              {{ formatDate(row.item.date) }}
            </template>
            <template v-slot:cell(customer)="row">
              {{ renderCustomer(row.item) }}
            </template>
            <template v-slot:cell(amount)="row">
              {{ formatMoney(row.item.amount) }}
            </template>
          </b-table>

          <!-- Project -->
          <div class="row m-0 mt-2">
            <h6 class="status font-weight-bold text-primary">
              {{ $t("dashboard.activeProject") }}
              <!-- ({{ $t("dashboard.sumNet") }}: {{ currency }}
              {{ formatMoney(totalProject.sum_net) }} -
              {{ $t("dashboard.sumGross") }}: {{ currency }}
              {{ formatMoney(totalProject.sum_gross) }} -
              {{ $t("dashboard.remainNet") }}: {{ currency }}
              {{ formatMoney(totalProject.remain_net) }} -
              {{ $t("dashboard.remainGross") }}: {{ currency }}
              {{ formatMoney(totalProject.remain_gross) }}) -->
              ({{ $t("dashboard.totalProjectAmount") }}: {{ currency }}
              {{ formatMoney(currentSummary.total_project_amount) }} - {{ $t("dashboard.totalRemainingAmount") }}:
              {{ currency }} {{ formatMoney(currentSummary.total_remaining_amount) }})
            </h6>
          </div>
          <b-table
            bordered
            hover
            selectable
            head-variant="light"
            :items="currentSummary.projects"
            :fields="project_fields"
            @row-clicked="selectProject"
          >
            <template v-slot:cell(date)="row">
              {{ formatDate(row.item.date) }}
            </template>
            <template v-slot:cell(customer)="row">
              {{ renderCustomer(row.item) }}
            </template>
            <template v-slot:cell(detail_cost)="row">
              <div>
                {{
                  $t("dashboard.net") +
                    ": " +
                    formatMoney(row.item.detail_cost.total_net + row.item.detail_cost.total_netnk)
                }}
              </div>
              <div>
                {{
                  $t("dashboard.gross") +
                    ": " +
                    formatMoney(row.item.detail_cost.total_gross + row.item.detail_cost.total_grossnk)
                }}
              </div>
            </template>
            <template v-slot:cell(name)="row">
              {{ row.item.number.custom_id ? row.item.number.custom_id : row.item.number.id }}
              {{ row.item.name }}
            </template>
            <!-- <template v-slot:cell(invoiced)="row">
              {{ formatMoney(row.item.invoiced) }}
            </template>
            <template v-slot:cell(remaining)="row">
              {{ formatMoney(row.item.remaining) }}
            </template>
            <template v-slot:cell(total_hours)="row">
              {{ row.item.total_hours.toFixed(2) + "h" }}
            </template>
            <template v-slot:cell(logged_hours)="row">
              <div
                :class="
                  renderLoggedTime(row.item.total_hours, row.item.logged_hours)
                "
              >
                {{ row.item.logged_hours.toFixed(2) + "h" }}
              </div>
            </template> -->
          </b-table>

          <!-- Invoice -->
          <div class="row m-0 mt-2">
            <h6 class="status font-weight-bold text-primary">
              {{ $t("dashboard.activeInvoice") }}
              <!-- ({{ $t("dashboard.gross") }}:
              {{ currency }} {{ formatMoney(totalInvoiceGross) }} -
              {{ $t("dashboard.net") }}: {{ currency }}
              {{ formatMoney(totalInvoiceNet) }}) -->
              ({{ $t("dashboard.totalOutstandingNetAmount") }}: {{ currency }}
              {{ formatMoney(currentSummary.total_open_net_amount) }} -
              {{ $t("dashboard.totalOutstandingGrossAmount") }}: {{ currency }}
              {{ formatMoney(currentSummary.total_open_gross_amount) }})
            </h6>
          </div>
          <b-table
            bordered
            hover
            selectable
            head-variant="light"
            :items="currentSummary.invoices"
            :fields="invoice_fields"
            @row-clicked="selectInvoice"
          >
            <template v-slot:cell(date)="row">
              {{ formatDate(row.item.date) }}
            </template>
            <template v-slot:cell(customer)="row">
              {{ renderCustomer(row.item) }}
            </template>
            <template v-slot:cell(detail_cost)="row">
              <div>
                {{ $t("dashboard.net") + ": " + formatMoney(row.item.detail_cost.total_net) }}
              </div>
              <div>
                {{
                  $t("dashboard.gross") +
                    ": " +
                    formatMoney(row.item.detail_cost.total_gross + row.item.detail_cost.total_gross_nk)
                }}
              </div>
            </template>
          </b-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import currency from "currency.js";
import moment from "moment";
import { mapGetters } from "vuex";
import { GET_DASHBOARD_SUMMARY } from "@/core/services/store/dashboard";
import { formatDate } from "@/common";

export default {
  props: {
    currency: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      offer_fields: [
        {
          key: "date",
          label: this.$t("dashboard.date"),
          sortable: false,
          thStyle: { width: "15%" }
        },
        {
          key: "customer",
          label: this.$t("dashboard.customer"),
          sortable: false,
          thStyle: { width: "25%" }
        },
        {
          key: "name",
          label: this.$t("dashboard.name"),
          sortable: false,
          thStyle: { width: "35%" }
        },
        {
          key: "amount",
          label: this.$t("dashboard.sum"),
          sortable: false,
          thStyle: { width: "25%" }
        }
      ],
      project_fields: [
        {
          key: "date",
          label: this.$t("dashboard.date"),
          sortable: false,
          thStyle: { width: "10%" }
        },
        {
          key: "name",
          label: this.$t("dashboard.name"),
          sortable: false,
          thStyle: { width: "20%" }
        },
        {
          key: "detail_cost",
          label: this.$t("dashboard.sum"),
          sortable: false,
          thStyle: { width: "15%" }
        },
        {
          key: "customer",
          label: this.$t("dashboard.customer"),
          sortable: false,
          thStyle: { width: "15%" }
        }
        // {
        //   key: "invoiced",
        //   label: this.$t("dashboard.invoiced"),
        //   sortable: false,
        //   thStyle: { width: "10%" }
        // },
        // {
        //   key: "remaining",
        //   label: this.$t("dashboard.remain"),
        //   sortable: false,
        //   thStyle: { width: "10%" }
        // },
        // {
        //   key: "total_hours",
        //   label: this.$t("dashboard.totalHour"),
        //   sortable: false,
        //   thStyle: { width: "10%" }
        // },
        // {
        //   key: "logged_hours",
        //   label: this.$t("dashboard.loggedHour"),
        //   sortable: false,
        //   thStyle: { width: "10%" }
        // }
      ],
      invoice_fields: [
        {
          key: "date",
          label: this.$t("dashboard.date"),
          sortable: false,
          thStyle: { width: "15%" }
        },
        {
          key: "customer",
          label: this.$t("dashboard.customer"),
          sortable: false,
          thStyle: { width: "25%" }
        },
        {
          key: "name",
          label: this.$t("dashboard.name"),
          sortable: false,
          thStyle: { width: "35%" }
        },
        {
          key: "detail_cost",
          label: this.$t("dashboard.sum"),
          sortable: false,
          thStyle: { width: "25%" }
        }
      ],
      loading: true
    };
  },
  computed: {
    ...mapGetters(["currentSummary"]),
    totalOffer() {
      let totalNet = 0.0;
      let totalGross = 0.0;
      if (this.currentSummary.offers) {
        for (const item of this.currentSummary.offers) {
          totalNet += item.detail_cost.total_net + item.detail_cost.total_net_nk;
          totalGross += item.detail_cost.total_gross + item.detail_cost.total_gross_nk;
        }
      }
      return {
        sum_net: totalNet,
        sum_gross: totalGross
      };
    },
    totalProject() {
      let totalNet = 0.0;
      let totalGross = 0.0;
      let remainNet = 0.0;
      let remainGross = 0.0;
      if (this.currentSummary.projects) {
        for (const item of this.currentSummary.projects) {
          totalNet += item.total_amount;
          totalGross += item.total_amount_gross;
          remainNet += item.remaining;
          remainGross += item.remaining_gross;
        }
      }
      return {
        sum_net: totalNet,
        sum_gross: totalGross,
        remain_net: remainNet,
        remain_gross: remainGross
      };
    },
    totalInvoiceGross() {
      let total = 0.0;
      if (this.currentSummary.invoices) {
        for (const item of this.currentSummary.invoices) {
          total += item.detail_cost.total_gross + item.detail_cost.total_gross_nk;
        }
      }
      return total;
    },
    totalInvoiceNet() {
      let total = 0.0;
      if (this.currentSummary.invoices) {
        for (const item of this.currentSummary.invoices) {
          total += item.detail_cost.total_net + item.detail_cost.total_net_nk;
        }
      }
      return total;
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_DASHBOARD_SUMMARY);
    this.loading = !this.loading;
  },
  methods: {
    formatDate,
    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    renderCustomer(item) {
      if (item.customer) {
        if (item.customer.company) {
          return item.customer.company;
        } else {
          return item.customer.first_name + ", " + item.customer.last_name;
        }
      }
    },
    renderLoggedTime(total, logged) {
      const all = parseFloat(total);
      const written = parseFloat(logged);
      if (written > all) {
        return "text-danger";
      } else {
        if (written / all >= 0.9) {
          return "text-warning";
        } else {
          return "text-success";
        }
      }
    },
    selectOffer(e) {
      this.$router.push(`/offer/${e.id}`);
    },
    selectProject(e) {
      this.$router.push(`/project/${e.id}`);
    },
    selectInvoice(e) {
      this.$router.push(`/invoice/${e.id}`);
    }
  }
};
</script>

<style scoped>
.subtext {
  color: #999999;
}

.item-link {
  cursor: pointer;
}

.item-link:hover {
  background-color: #e3e3e4;
  font-weight: bold;
}

.name-field,
.customer-field {
  width: 170px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

@media screen and (min-width: 1440px) and (max-width: 1599px) {
  .name-field,
  .customer-field {
    width: 150px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}

@media screen and (max-width: 1280px) {
  .name-field,
  .customer-field {
    width: 120px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
