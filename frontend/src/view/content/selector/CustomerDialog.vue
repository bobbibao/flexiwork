<template>
  <div>
    <b-button v-show="!disabled" variant="primary" class="add-btn" @click="showDialog">
      {{ $t("button.selectCustomer") }}
    </b-button>
    <div v-show="selectedCustomer.company || selectedCustomer.first_name" class="row mt-4">
      <div class="col-md-3">
        <div class="customer">
          <div class="font-weight-bolder">
            {{ renderName(selectedCustomer) }}
          </div>
          <div v-if="selectedCustomer.other_address">
            {{ selectedCustomer.other_address }}
          </div>
          <div>{{ selectedCustomer.address }}</div>
          <div>
            {{ selectedCustomer.postcode + " - " + selectedCustomer.place }}
          </div>
        </div>
      </div>
    </div>
    <!-- Dialog -->
    <b-modal
      v-model="dialog"
      hide-footer
      no-close-on-backdrop
      size="xl"
      @close="loading = true"
      :title="`${$t('menu.address')}`"
    >
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
        hover
        selectable
        head-variant="light"
        :items="customers"
        :fields="fields"
        :current-page="currentPage"
        :per-page="perPage"
        :filter="filter"
        :busy="loading"
        @filtered="onFiltered"
        @row-clicked="selectCustomer"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
          </div>
        </template>

        <template v-slot:cell(name)="row">
          {{ renderName(row.item) }}
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
    </b-modal>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { SET_SELECTEDCUSTOMER, GET_CUSTOMERS, SET_CUSTOMER_EDITED } from "@/core/services/store/customer";

export default {
  props: {
    disabled: {
      type: Boolean,
      dafault: false
    }
  },
  data() {
    return {
      dialog: false,
      loading: true,
      totalRows: 1,
      currentPage: 1,
      perPage: 10,
      pageOptions: [10, 20, 30],
      filter: null,
      fields: [
        {
          key: "name",
          label: this.$t("customer.name"),
          sortable: true,
          thStyle: { width: "20%" }
        },
        {
          key: "category",
          label: this.$t("customer.category"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "address",
          label: this.$t("customer.address"),
          sortable: true,
          thStyle: { width: "20%" }
        },
        {
          key: "postcode",
          label: this.$t("customer.postcode"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "place",
          label: this.$t("customer.place"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "email",
          label: this.$t("customer.mail"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "phone",
          label: this.$t("customer.phone"),
          sortable: true,
          thStyle: { width: "15%" }
        }
      ]
    };
  },
  computed: {
    ...mapGetters(["selectedCustomer", "currentCustomers"]),
    customers() {
      let arr = [];
      for (const item of this.currentCustomers) {
        item.category = this.renderCategory(item.category);
        arr.push(item);
      }
      return arr;
    }
  },
  mounted() {
    this.totalRows = this.currentCustomers.length;
  },
  destroyed() {
    this.$store.commit(SET_SELECTEDCUSTOMER, {});
    this.$store.commit(SET_CUSTOMER_EDITED, false);
  },
  methods: {
    async showDialog() {
      this.dialog = true;
      await this.$store.dispatch(GET_CUSTOMERS);
      this.loading = false;
    },
    async selectCustomer(e) {
      await this.$store.commit(SET_SELECTEDCUSTOMER, e);
      this.$store.commit(SET_CUSTOMER_EDITED, true);
      this.dialog = false;
      this.loading = true;
    },
    renderName(item) {
      if (item.type === "company") {
        return item.company;
      } else {
        return item.first_name + ", " + item.last_name;
      }
    },
    renderCategory(item) {
      if (item === "customer") {
        return this.$t("address.catCustomer");
      } else if (item === "supplier") {
        return this.$t("address.catSupplier");
      } else {
        return this.$t("address.catAcquisition");
      }
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
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

.customer {
  background-color: #f3f6f9;
  padding: 1rem;
  border-radius: 0.42rem;
}

.customer:hover {
  background-color: #e3e3e4;
}
</style>
