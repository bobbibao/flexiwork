<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0 action-start">
          <h3 class="m-0">{{ $t("menu.addresses") }}</h3>
        </div>
        <!-- Actions -->
        <div class="col-md-6 p-0 action">
          <b-button variant="success" size="lg" class="upload-btn mr-2" @click="upload_dialog = true">
            <i class="menu-icon flaticon-upload"></i>
            <span class="menu-text"> {{ $t("button.upload") }}(.vcf) </span>
          </b-button>
          <b-button variant="primary" size="lg" class="add-btn" @click="goTo('/address/create')">
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
          :items="customers"
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

          <template v-slot:cell(name)="row">
            {{ renderName(row.item) }}
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
      <div>{{ $t("msg.delAdr") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove" :disabled="removing">
          <b-spinner small v-if="removing"></b-spinner>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Upload Dialog -->
    <b-modal v-model="upload_dialog" hide-footer no-close-on-backdrop :title="`${$t('menu.address')}`">
      <div class="col-md-12 p-0">
        <b-form-file
          v-model="file"
          :placeholder="`${$t('msg.selectFile')}`"
          :drop-placeholder="`${$t('msg.dropFile')}`"
          accept=".vcf"
        ></b-form-file>
      </div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="upload">
          {{ $t("button.upload") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import {
  GET_CUSTOMERS,
  DELETE_CUSTOMER,
  UPLOAD_VCF,
  SET_CUSTOMER_TOAST,
  SET_CUSTOMER_ERROR
} from "@/core/services/store/customer";

export default {
  name: "Address",
  metaInfo: {
    title: "Address",
    meta: [
      { hid: "description", name: "description", content: "Address Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Address | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Address | Archapp"
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
          key: "name",
          label: this.$t("address.name"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "category",
          label: this.$t("address.category"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "address",
          label: this.$t("address.address"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "postcode",
          label: this.$t("address.postcode"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "place",
          label: this.$t("address.place"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "email",
          label: this.$t("address.mail"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "phone",
          label: this.$t("address.phone"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "actions",
          label: this.$t("address.actions"),
          thStyle: { width: "5%" }
        }
      ],
      totalRows: 1,
      currentPage: 1,
      perPage: 20,
      pageOptions: [20, 40, 60],
      filter: null,
      file: null,
      delete_id: 0,
      remove_dialog: false,
      upload_dialog: false,
      loading: true,
      removing: false
    };
  },
  computed: {
    ...mapGetters(["currentCustomers"]),
    ...mapState({
      error: state => state.customer.error,
      toast: state => state.customer.toast
    }),
    customers() {
      let arr = [];
      for (const item of this.currentCustomers) {
        item.category = this.renderCategory(item.category);
        arr.push(item);
      }
      return arr;
    }
  },
  async mounted() {
    if (this.toast) {
      await this.toastMsg(this.toast.type, this.toast.msg);
      this.$store.commit(SET_CUSTOMER_TOAST, null);
    }
    await this.$store.dispatch(GET_CUSTOMERS);
    this.totalRows = this.currentCustomers.length;
    this.loading = !this.loading;
  },
  methods: {
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
    async upload() {
      if (this.file) {
        await this.$store.dispatch(UPLOAD_VCF, { file: this.file });
        if (this.error) {
          this.toastMsg("error", this.error);
          this.$store.commit(SET_CUSTOMER_ERROR, null);
        } else {
          this.upload_dialog = false;
          this.toastMsg("success", this.$t("msg.uploadSuccess"));
          this.loading = !this.loading;
          await this.$store.dispatch(GET_CUSTOMERS);
          this.loading = !this.loading;
        }
      } else {
        this.toastMsg("error", this.$t("msg.noFile"));
      }
    },
    edit(item) {
      this.goTo(`/address/${item.id}`);
    },
    remove(item) {
      this.delete_id = item.id;
      this.remove_dialog = true;
    },
    async confirmRemove() {
      if (this.removing) return;
      this.removing = true;
      try {
        await this.$store.dispatch(DELETE_CUSTOMER, { id: this.delete_id });
        this.remove_dialog = false;
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.delSuccess"));
          this.loading = !this.loading;
          await this.$store.dispatch(GET_CUSTOMERS);
          this.loading = !this.loading;
        }
      } finally {
        this.removing = false;
      }
    },
    goTo(name) {
      this.$router.push(name);
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
</style>
