<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0 action-start">
          <h3 class="m-0 mr-4">{{ $t("menu.expense") }}</h3>
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
              v-if="item === 'pending'"
              class="filter-badge"
              :class="{ active: status === 'pending' }"
              variant="info"
              @click="filterStatus(item)"
            >
              <div class="text-capitalize">
                {{ $t("status.pending") }}
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
          <b-button variant="primary" size="lg" class="add-btn" @click="goTo('/expense/create')">
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
          </div>
        </div>
        <!-- Data Table -->
        <b-table
          bordered
          head-variant="light"
          :items="expenses"
          :fields="fields"
          :current-page="currentPage"
          :per-page="perPage"
          :filter="filter"
          :busy="loading"
          @filtered="onFiltered"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
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
            <i class="action-icon flaticon2-writing mr-2" @click="edit(row.item)"></i>
            <i class="action-icon flaticon2-rubbish-bin" @click="remove(row.item)"></i>
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
      <div>{{ $t("msg.delExpense") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove">
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
import { GET_EXPENSES, DELETE_EXPENSE, SET_EXPENSE_TOAST, FILTER_EXPENSE } from "@/core/services/store/expense";
import { formatDate } from "@/common";

export default {
  name: "expense",
  metaInfo: {
    title: "Expense",
    meta: [
      { hid: "description", name: "description", content: "Expense Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Expense | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Expense | Archapp"
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
          key: "recipient",
          label: this.$t("expense.name"),
          sortable: true,
          thStyle: { width: "25%" }
        },
        {
          key: "payment_ref",
          label: this.$t("expense.paymentRef"),
          sortable: true,
          thStyle: { width: "25%" }
        },
        {
          key: "date",
          label: this.$t("expense.date"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "amount",
          label: this.$t("expense.amount"),
          sortable: true,
          thStyle: { width: "20%" }
        },
        {
          key: "status",
          label: "Status",
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "actions",
          label: this.$t("expense.actions"),
          thStyle: { width: "5%" }
        }
      ],
      totalRows: 1,
      currentPage: 1,
      perPage: 20,
      pageOptions: [20, 40, 60],
      status: "all",
      statusOptions: ["pending", "archive"],
      filter: null,
      remove_dialog: false,
      loading: true,
      delete_id: 0
    };
  },
  computed: {
    ...mapGetters(["currentExpenses"]),
    ...mapState({
      error: state => state.expense.error,
      toast: state => state.expense.toast
    }),
    expenses() {
      let arr = [];
      for (const item of this.currentExpenses) {
        item.date = formatDate(item.date);
        item.amount = this.formatMoney(item.amount);
        item.status = this.renderStatus(item.status);
        arr.push(item);
      }
      return arr;
    }
  },
  async mounted() {
    if (this.toast) {
      await this.toastMsg(this.toast.type, this.toast.msg);
      this.$store.commit(SET_EXPENSE_TOAST, null);
    }
    await this.$store.dispatch(GET_EXPENSES);
    this.totalRows = this.currentExpenses.length;
    this.loading = !this.loading;
  },
  methods: {
    formatDate,
    edit(item) {
      this.goTo(`/expense/${item.id}`);
    },
    remove(item) {
      this.delete_id = item.id;
      this.remove_dialog = true;
    },
    async confirmRemove() {
      await this.$store.dispatch(DELETE_EXPENSE, { id: this.delete_id });
      this.remove_dialog = false;
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.delSuccess"));
        this.loading = !this.loading;
        await this.$store.dispatch(GET_EXPENSES);
        this.loading = !this.loading;
      }
    },
    renderStatus(item) {
      if (item === "pending") {
        return this.$t("status.pending");
      } else if (item === "deleted") {
        return this.$t("status.deleted");
      } else {
        return this.$t("status.archive");
      }
    },
    renderStatusStyle(item) {
      if (item === this.$t("status.pending")) {
        return "info";
      } else {
        return null;
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
        await this.$store.dispatch(GET_EXPENSES);
      } else {
        await this.$store.dispatch(FILTER_EXPENSE, { filter: filter });
      }
      this.loading = !this.loading;
    }
  }
};
</script>

<style scoped>
.action-icon:hover {
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
</style>
