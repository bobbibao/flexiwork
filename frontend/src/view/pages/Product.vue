<template>
  <div>
    <!-- Group -->
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0 action-start">
          <h3 class="m-0">{{ $t("menu.group") }}</h3>
        </div>
        <!-- Actions -->
        <div class="col-md-6 p-0 action">
          <b-button variant="primary" size="lg" class="add-btn" @click="goTo('/product-group/create')">
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
            <b-form-select
              v-model="perPageGroup"
              id="perPageSelectGroup"
              size="sm"
              :options="pageOptions"
            ></b-form-select>
            <span class="ml-2">{{ $t("button.entries") }}</span>
          </div>
          <div class="col-md-9 action">
            <span class="mr-2">{{ $t("button.search") }}:</span>
            <b-form-input v-model="filterGroup" type="search" id="filterGroup"></b-form-input>
          </div>
        </div>
        <!-- Data Table -->
        <b-table
          bordered
          head-variant="light"
          :items="currentGroups"
          :fields="fieldsGroup"
          :current-page="currentPageGroup"
          :per-page="perPageGroup"
          :filter="filterGroup"
          :busy="loadingGroup"
          @filtered="onFilteredGroup"
          sort-by="name"
          :sort-desc="false"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>

          <template v-slot:cell(name)="row">
            <div class="name-cell" @click="goTo(`/product-group/${row.item.id}`)">
              {{ row.item.name }}
            </div>
          </template>

          <template v-slot:cell(actions)="row">
            <i class="action-icon flaticon2-writing mr-2" @click="editGroup(row.item)"></i>
            <i class="action-icon flaticon2-rubbish-bin mr-2" @click="removeGroup(row.item)"></i>
          </template>
        </b-table>
        <!-- Pagination -->
        <div class="row action">
          <div class="col-md-3">
            <b-pagination
              v-model="currentPageGroup"
              :total-rows="totalRowsGroup"
              :per-page="perPageGroup"
              align="fill"
              size="md"
              class="my-0"
            ></b-pagination>
          </div>
        </div>
      </div>
    </div>

    <!-- Product -->
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0 action-start">
          <h3 class="m-0">{{ $t("menu.product") }}</h3>
        </div>
        <!-- Actions -->
        <div class="col-md-6 p-0 action">
          <b-form-select
            v-model="folderProduct"
            :options="folders"
            value-field="value"
            text-field="name"
            class="folder-select mr-2"
            @change="initProduct"
          ></b-form-select>
          <b-button variant="primary" size="lg" class="add-btn" @click="goTo('/product/create')">
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
            <b-form-select
              v-model="perPageProduct"
              id="perPageSelectProduct"
              size="sm"
              :options="pageOptions"
            ></b-form-select>
            <span class="ml-2">{{ $t("button.entries") }}</span>
          </div>
          <div class="col-md-9 action">
            <span class="mr-2">{{ $t("button.search") }}:</span>
            <b-form-input v-model="filterProduct" type="search" id="filterProduct"></b-form-input>
          </div>
        </div>
        <!-- Data Table -->
        <b-table
          bordered
          head-variant="light"
          :items="products"
          :fields="fieldsProduct"
          :current-page="currentPageProduct"
          :per-page="perPageProduct"
          :filter="filterProduct"
          :busy="loadingProduct"
          @filtered="onFilteredProduct"
          sort-by="name"
          :sort-desc="false"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>

          <template v-slot:cell(name)="row">
            <div class="name-cell" @click="goTo(`/product/${row.item.id}`)">
              {{ row.item.name }}
            </div>
          </template>

          <template v-slot:cell(unit)="row">
            {{ row.item.unit.description }}
          </template>

          <template v-slot:cell(vat_rate)="row">
            {{ row.item.vat_rate.rate }}
          </template>

          <template v-slot:cell(actions)="row">
            <i class="action-icon flaticon2-writing mr-2" @click="editProduct(row.item)"></i>
            <i class="action-icon flaticon2-rubbish-bin" @click="removeProduct(row.item)"></i>
          </template>
        </b-table>
        <!-- Pagination -->
        <div class="row action">
          <div class="col-md-3">
            <b-pagination
              v-model="currentPageProduct"
              :total-rows="totalRowsProduct"
              :per-page="perPageProduct"
              align="fill"
              size="md"
              class="my-0"
            ></b-pagination>
          </div>
        </div>
      </div>
    </div>

    <!-- Remove Product Dialog -->
    <b-modal v-model="remove_dialog_product" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delProduct") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemoveProduct" :disabled="loadingProduct">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
    <!-- Remove Group Dialog -->
    <b-modal v-model="remove_dialog_group" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delGroup") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemoveGroup" :disabled="loadingGroup">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import currency from "currency.js";
import { mapGetters, mapState } from "vuex";
import {
  GET_PRODUCTS,
  GET_GROUPS,
  DELETE_PRODUCT,
  DELETE_GROUP,
  SET_PRODUCT_TOAST
} from "@/core/services/store/product";
import { GET_SETTINGS } from "@/core/services/store/settings";

export default {
  name: "product",
  metaInfo: {
    title: "Product",
    meta: [
      { hid: "description", name: "description", content: "Product Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Product | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Product | Archapp"
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
      fieldsProduct: [
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
          thStyle: { width: "30%" }
        },
        {
          key: "unit",
          label: this.$t("product.unit"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "vat_rate",
          label: this.$t("product.vat"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "price",
          label: this.$t("product.price"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "actions",
          label: this.$t("product.actions"),
          thStyle: { width: "5%" }
        }
      ],
      fieldsGroup: [
        {
          key: "name",
          label: this.$t("product.name"),
          sortable: true,
          thStyle: { width: "45%" }
        },
        {
          key: "description",
          label: this.$t("product.desc"),
          sortable: true,
          thStyle: { width: "50%" }
        },
        {
          key: "actions",
          label: this.$t("product.actions"),
          thStyle: { width: "5%" }
        }
      ],
      totalRowsProduct: 1,
      totalRowsGroup: 1,
      currentPageProduct: 1,
      currentPageGroup: 1,
      perPageProduct: 20,
      perPageGroup: 20,
      pageOptions: [20, 40, 60],
      filterProduct: null,
      filterGroup: null,
      remove_dialog_product: false,
      remove_dialog_group: false,
      loadingProduct: true,
      loadingGroup: true,
      product_id: 0,
      group_id: 0,
      folders: [{ name: this.$t("status.all"), value: "all" }],
      folderProduct: "all"
    };
  },
  computed: {
    ...mapGetters(["currentProducts", "currentGroups", "currentSettings"]),
    ...mapState({
      error: state => state.product.error,
      toast: state => state.product.toast
    }),
    products() {
      let arr = [];

      for (const item of this.currentProducts) {
        item.price = this.formatMoney(item.price);
        item.unit.description = this.$t(item.unit.description);
        arr.push(item);
      }
      return arr;
    }
  },
  async mounted() {
    if (this.toast) {
      this.toastMsg(this.toast.type, this.toast.msg);
      this.$store.commit(SET_PRODUCT_TOAST, null);
    }
    await this.$store.dispatch(GET_SETTINGS);
    if (this.currentSettings.product && this.currentSettings.product?.folders.length > 0) {
      for (const item of this.currentSettings.product?.folders) {
        this.folders.push({
          name: item.name,
          value: item.name
        });
      }
    }

    await this.initProduct();
    await this.$store.dispatch(GET_GROUPS);
    this.totalRowsGroup = this.currentGroups.length;
    this.loadingGroup = !this.loadingGroup;
  },
  methods: {
    async initProduct() {
      this.loadingProduct = true;
      await this.$store.dispatch(GET_PRODUCTS, {
        folder: this.folderProduct === "all" ? "" : this.folderProduct
      });
      for (const item of this.currentProducts) {
        item.price = this.formatMoney(item.price);
        item.unit.description = this.$t(item.unit.description);
        this.products.push(item);
      }
      this.totalRowsProduct = this.currentProducts.length;
      this.loadingProduct = false;
    },
    editProduct(item) {
      this.goTo(`/product/${item.id}`);
    },
    editGroup(item) {
      this.goTo(`/product-group/${item.id}`);
    },
    removeProduct(item) {
      this.product_id = item.id;
      this.remove_dialog_product = true;
    },
    async confirmRemoveProduct() {
      this.loadingProduct = true;
      await this.$store.dispatch(DELETE_PRODUCT, { id: this.product_id });
      this.remove_dialog_product = false;
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.delSuccess"));
        await this.$store.dispatch(GET_PRODUCTS, {
          folder: this.folderProduct === "all" ? "" : this.folderProduct
        });
      }
      this.loadingProduct = false;
    },
    removeGroup(item) {
      this.group_id = item.id;
      this.remove_dialog_group = true;
    },
    async confirmRemoveGroup() {
      this.loadingGroup = true;
      await this.$store.dispatch(DELETE_GROUP, { id: this.group_id });
      this.remove_dialog_group = false;
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.delSuccess"));
        await this.$store.dispatch(GET_GROUPS);
      }
      this.loadingGroup = false;
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
    onFilteredProduct(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRowsProduct = filteredItems.length;
      this.currentPageProduct = 1;
    },
    onFilteredGroup(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRowsGroup = filteredItems.length;
      this.currentPageGroup = 1;
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

#perPageSelectProduct,
#perPageSelectGroup {
  width: 25%;
}

#filterProduct,
#filterGroup {
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

.name-cell {
  cursor: pointer;
  text-decoration: underline;
}

.folder-select {
  width: 200px;
}
</style>
