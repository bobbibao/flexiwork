<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0 action-start">
          <h3 class="m-0 mr-4">{{ $t("menu.offers") }}</h3>
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
              v-if="item === 'active'"
              class="filter-badge"
              :class="{ active: status === 'active' }"
              variant="success"
              @click="filterStatus(item)"
            >
              <div class="text-capitalize">
                {{ $t("status.active") }}
              </div>
            </b-badge>
            <b-badge
              v-else-if="item === 'deleted'"
              class="filter-badge"
              :class="{ active: status === 'deleted' }"
              variant="danger"
              @click="filterStatus(item)"
            >
              <div class="text-capitalize">
                {{ $t("status.deleted") }}
              </div>
            </b-badge>
            <b-badge v-else class="filter-badge" :class="{ active: status === 'archive' }" @click="filterStatus(item)">
              <div class="text-capitalize">
                {{ $t("status.archive") }}
              </div>
            </b-badge>
          </div>
        </div>
        <!-- Actions -->
        <div class="col-md-6 p-0 action">
          <b-button variant="primary" size="lg" class="add-btn" @click="goTo('/offer/create')">
            <i class="menu-icon flaticon2-plus-1"></i>
            <span class="menu-text"> {{ $t("button.add") }} </span>
          </b-button>
        </div>
      </div>
      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <div class="row m-0 mb-4">
          <h6 class="status font-weight-bold text-primary">
            {{ $t("dashboard.sumNet") }}: {{ formatMoney(totalOffer.sum_net) }} - {{ $t("dashboard.sumGross") }}:
            {{ formatMoney(totalOffer.sum_gross) }}
          </h6>
        </div>

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
          </div>
        </div>
        <!-- Data Table -->
        <b-table
          bordered
          head-variant="light"
          :items="offers"
          :fields="fields"
          :current-page="currentPage"
          :per-page="perPage"
          :filter-included-fields="filterIncludedFields"
          :filter="filter"
          :busy="loading"
          :sort-compare="mySortCompare"
          @filtered="onFiltered"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>

          <template v-slot:cell(active)="row">
            <b-form-checkbox
              class="visible-box"
              size="lg"
              :checked="row.item.status === $t('status.active')"
              @change="setActive(row.item)"
            />
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
              <div class="name-cell" @click="goTo(`/offer/${row.item.id}`)">
                {{ row.item.name + ", " + row.item.location }}
              </div>
            </div>
          </template>

          <template v-slot:cell(customer)="row">
            {{ renderName(row.item) }}
          </template>

          <template v-slot:cell(number)="row">
            {{ row.item.number.id }}
          </template>

          <template v-slot:cell(detail_cost)="row">
            <div>
              {{
                $t("offer.net") + ": " + formatMoney(row.item.detail_cost.total_net + row.item.detail_cost.total_net_nk)
              }}
            </div>
            <div>
              {{
                $t("offer.gross") +
                  ": " +
                  formatMoney(row.item.detail_cost.total_gross + row.item.detail_cost.total_gross_nk)
              }}
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
              @click="print(row.item)"
              v-b-tooltip.hover
              title="Export to PDF"
            ></i>
            <i
              class="action-icon flaticon2-checking mr-2"
              @click="duplicateOffer(row.item)"
              v-b-tooltip.hover
              title="Duplicate"
            ></i>
            <i class="action-icon flaticon2-rubbish-bin" @click="remove(row.item)" v-b-tooltip.hover title="Delete"></i>
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
      <div>{{ $t("msg.delOffer") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import moment from "moment";
import currency from "currency.js";
import { mapGetters, mapState } from "vuex";
import i18nService from "@/core/services/i18n.service.js";
import {
  GET_OFFERS,
  DELETE_OFFER,
  COPY_OFFER,
  TOGGLE_OFFER,
  SET_OFFER_TOAST,
  FILTER_OFFER,
  EXPORT_OFFER_PDF
} from "@/core/services/store/offer";
import { formatDate } from "@/common";

export default {
  name: "offer",
  metaInfo: {
    title: "Offer",
    meta: [
      { hid: "description", name: "description", content: "Offer Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Offer | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Offer | Archapp"
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
          key: "active",
          label: this.$t("offer.active"),
          thStyle: { width: "5%" }
        },
        {
          key: "customer",
          label: this.$t("offer.name"),
          sortable: true,
          thStyle: { width: "20%" }
        },
        {
          key: "name",
          label: this.$t("offer.title"),
          sortable: true,
          thStyle: { width: "20%" }
        },
        {
          key: "number",
          label: this.$t("offer.number"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "detail_cost",
          label: this.$t("offer.sum"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "date",
          label: this.$t("offer.date"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "status",
          label: this.$t("offer.status"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "actions",
          label: this.$t("offer.actions"),
          thStyle: { width: "5%" }
        }
      ],
      totalRows: 1,
      currentPage: 1,
      perPage: 20,
      pageOptions: [20, 40, 60],
      status: "all",
      statusOptions: ["active", "deleted", "archive"],
      filter: null,
      remove_dialog: false,
      loading: true,
      delete_id: 0,
      filterIncludedFields: ["customer", "name", "number", "date", "status"]
    };
  },
  computed: {
    ...mapGetters(["currentOffers"]),
    ...mapState({
      error: state => state.offer.error,
      toast: state => state.offer.toast,
      pdf_code: state => state.offer.pdf
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    offers() {
      let arr = [];
      for (const item of this.currentOffers) {
        item.date = formatDate(item.details.date);
        item.status = this.renderStatus(item.status);
        item.location = item.details.location ?? "";
        arr.push(item);
      }
      return arr;
    },
    totalOffer() {
      let totalNet = 0.0;
      let totalGross = 0.0;
      if (this.currentOffers) {
        for (const item of this.currentOffers) {
          if (item.status === this.$t("status.active")) {
            totalNet += item.detail_cost.total_net + item.detail_cost.total_net_nk;
            totalGross += item.detail_cost.total_gross + item.detail_cost.total_gross_nk;
          }
        }
      }
      return {
        sum_net: totalNet,
        sum_gross: totalGross
      };
    }
  },
  async mounted() {
    if (this.toast) {
      await this.toastMsg(this.toast.type, this.toast.msg);
      this.$store.commit(SET_OFFER_TOAST, null);
    }
    await this.$store.dispatch(GET_OFFERS);
    this.totalRows = this.currentOffers.length;
    this.loading = !this.loading;
  },
  methods: {
    formatDate,
    async setActive(item) {
      await this.$store.dispatch(TOGGLE_OFFER, { id: item.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        this.loading = !this.loading;
        await this.$store.dispatch(GET_OFFERS);
        this.loading = !this.loading;
      }
    },
    async duplicateOffer(item) {
      await this.$store.dispatch(COPY_OFFER, { id: item.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.copySuccess"));
        this.loading = !this.loading;
        await this.filterStatus(this.status);
        this.loading = !this.loading;
      }
    },
    renderName(item) {
      if (item.customer) {
        if (item.customer.type == "company") {
          return item.customer.company;
        } else {
          return item.customer.first_name + ", " + item.customer.last_name;
        }
      }
    },
    renderStatus(item) {
      if (item === "active") {
        return this.$t("status.active");
      } else if (item === "deleted") {
        return this.$t("status.deleted");
      } else {
        return this.$t("status.archive");
      }
    },
    renderStatusStyle(item) {
      if (item === this.$t("status.active")) {
        return "success";
      } else if (item === this.$t("status.deleted")) {
        return "danger";
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

      await this.$store.dispatch(EXPORT_OFFER_PDF, {
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
      await this.$store.dispatch(DELETE_OFFER, { id: this.delete_id });
      this.remove_dialog = false;
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.delSuccess"));
        this.loading = true;
        await this.filterStatus(this.status);
        this.loading = false;
      }
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
        await this.$store.dispatch(GET_OFFERS);
      } else {
        await this.$store.dispatch(FILTER_OFFER, { filter: filter });
      }
      // Update table pagination after filtered
      this.onFiltered(this.currentOffers);
      this.loading = !this.loading;
    },
    mySortCompare(a, b, key) {
      if (key === "date") {
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

.editor {
  height: 15rem;
}

.editor > div {
  height: 10rem;
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
</style>
