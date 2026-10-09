<template>
  <div>
    <b-button variant="primary" class="add-btn" @click="showDialog">
      <i class="menu-icon flaticon2-plus"></i>
      <span class="menu-text"> {{ $t("button.product") }} </span>
    </b-button>
    <!-- Dialog -->
    <b-modal
      v-model="dialog"
      hide-footer
      no-close-on-backdrop
      size="xl"
      @close="(loading = true), resetFolder()"
      :title="`${$t('menu.product')}`"
    >
      <!-- Search -->
      <div class="row mb-4">
        <div class="col-md-3 action-start">
          <span class="mr-2">{{ $t("button.show") }}</span>
          <b-form-select
            v-model="perPage"
            id="perPageSelect"
            size="sm"
            :options="pageOptions"
          ></b-form-select>
          <span class="ml-2">{{ $t("button.entries") }}</span>
        </div>
        <div class="col-md-7 action">
          <span class="mr-2">{{ $t("button.search") }}:</span>
          <b-form-input
            v-model="filter"
            type="search"
            id="filterInput"
          ></b-form-input>
        </div>
        <div class="col-md-2">
          <b-form-select
            v-model="folder"
            :options="folders"
            value-field="value"
            text-field="name"
            class="folder-select mr-2"
            @change="initProduct"
          ></b-form-select>
        </div>
      </div>
      <!-- Data Table -->
      <b-table
        bordered
        hover
        selectable
        head-variant="light"
        :items="products"
        :fields="fields"
        :current-page="currentPage"
        :per-page="perPage"
        :filter="filter"
        :busy="loading"
        @filtered="onFiltered"
        @row-clicked="selectProduct"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
          </div>
        </template>

        <template v-slot:cell(unit)="row">
          {{ row.item.unit.display }}
        </template>

        <template v-slot:cell(vat_rate)="row">
          {{ row.item.vat_rate.rate }}
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
import currency from "currency.js";
import { mapGetters } from "vuex";
import { GET_PRODUCTS } from "@/core/services/store/product";
import { GET_SETTINGS } from "@/core/services/store/settings";

export default {
  props: {
    addProduct: {
      type: Function,
      default: null
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
          label: this.$t("product.name"),
          sortable: true,
          thStyle: { width: "25%" }
        },
        {
          key: "description",
          label: this.$t("product.desc"),
          sortable: true,
          thStyle: { width: "35%" }
        },
        {
          key: "unit",
          label: this.$t("product.unit"),
          sortable: false,
          thStyle: { width: "15%" }
        },
        {
          key: "vat_rate",
          label: this.$t("product.vat"),
          sortable: false,
          thStyle: { width: "5%" }
        },
        {
          key: "price",
          label: this.$t("product.price"),
          sortable: true,
          thStyle: { width: "20%" }
        }
      ],
      folders: [{ name: this.$t("status.all"), value: "all" }],
      folder: "all"
    };
  },
  computed: {
    ...mapGetters(["currentProducts", "currentSettings"]),
    products() {
      let arr = [];
      for (const item of this.currentProducts) {
        item.price = this.formatMoney(item.price);
        item.unit["display"] = this.$t(item.unit.description);
        arr.push(item);
      }
      return arr;
    }
  },
  watch: {
    currentProducts(val) {
      if (val) {
        this.totalRows = val.length;
      }
    }
  },
  methods: {
    async showDialog() {
      await this.$store.dispatch(GET_SETTINGS);
      if (
        this.currentSettings.product &&
        this.currentSettings.product.folders.length > 0
      ) {
        for (const item of this.currentSettings.product.folders) {
          this.folders.push({
            name: item.name,
            value: item.name
          });
        }
      }
      this.dialog = true;
      await this.initProduct();
    },
    async initProduct() {
      this.loading = true;
      await this.$store.dispatch(GET_PRODUCTS, {
        folder: this.folder === "all" ? "" : this.folder
      });
      this.totalRows = this.currentProducts.length;
      this.loading = false;
    },
    async selectProduct(e) {
      await this.addProduct(e);
      this.dialog = false;
      this.loading = true;
    },
    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },
    resetFolder() {
      this.folders = [{ name: this.$t("status.all"), value: "all" }];
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
</style>
