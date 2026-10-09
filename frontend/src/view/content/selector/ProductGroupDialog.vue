<template>
  <div>
    <b-button variant="primary" class="add-btn" @click="showDialog">
      <i class="menu-icon flaticon2-plus"></i>
      <span class="menu-text"> {{ $t("button.group") }} </span>
    </b-button>
    <!-- Dialog -->
    <b-modal
      v-model="dialog"
      hide-footer
      no-close-on-backdrop
      size="xl"
      @close="loading = true"
      :title="`${$t('menu.group')}`"
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
        <div class="col-md-9 action">
          <span class="mr-2">{{ $t("button.search") }}:</span>
          <b-form-input
            v-model="filter"
            type="search"
            id="filterInput"
          ></b-form-input>
        </div>
      </div>
      <!-- Data Table -->
      <b-table
        bordered
        hover
        selectable
        head-variant="light"
        :items="currentGroups"
        :fields="fields"
        :current-page="currentPage"
        :per-page="perPage"
        :filter="filter"
        :busy="loading"
        @filtered="onFiltered"
        @row-clicked="selectGroup"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
          </div>
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
import { GET_GROUPS } from "@/core/services/store/product";

export default {
  props: {
    addGroup: {
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
          thStyle: { width: "50%" }
        },
        {
          key: "description",
          label: this.$t("product.desc"),
          sortable: true,
          thStyle: { width: "50%" }
        }
      ]
    };
  },
  computed: {
    ...mapGetters(["currentGroups"])
  },
  mounted() {
    this.totalRows = this.currentGroups.length;
  },
  methods: {
    async showDialog() {
      this.dialog = true;
      await this.$store.dispatch(GET_GROUPS);
      this.loading = false;
    },
    async selectGroup(e) {
      await this.addGroup(e);
      this.dialog = false;
      this.loading = true;
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
</style>
