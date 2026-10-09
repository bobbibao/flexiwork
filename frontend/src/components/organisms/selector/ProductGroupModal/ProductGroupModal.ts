import ApiService from "@/api/api.service";
import { Response } from "@/common/dtos";
import { PlusIcon } from "@/components/atoms";
import TableProduct from "@/components/organisms/TableProduct/TableProduct.vue";
import SearchInput from "@/components/molecules/SearchInput/SearchInput.vue";
import { defineComponent, ref, Ref } from "vue";
import { ITablePagination } from "../../table/type";
import { CommonService } from "@/common/services";
import { Product } from "@/common/models/product.model";
import { ProductGroup } from "@/common/models/productGroup.model";

const commonService = new CommonService();

export default defineComponent({
  name: "ProductGroupModal",
  components: {
    PlusIcon,
    TableProduct,
    SearchInput
  },
  props: {
    addGroup: {
      type: Function,
      default: null
    }
  },
  data() {
    const pagination: Ref<ITablePagination | undefined> = ref<ITablePagination>();
    const search = ref<string>("");

    return {
      search,
      pagination,
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
          thStyle: { width: "50%" },
          tdClass: "text-wrap",
          thClass: "text-wrap"
        },
        {
          key: "description",
          label: this.$t("product.desc"),
          sortable: true,
          thStyle: { width: "50%" },
          tdClass: "text-wrap",
          thClass: "text-wrap"
        }
      ],
      currentGroups: [] as ProductGroup[]
    };
  },
  computed: {
    groups() {
      this.pagination = {
        currentPage: 1,
        pageSize: 10,
        totalItems: this.currentGroups.length,
        totalPages: Math.ceil(this.currentGroups.length / 10)
      };
      return this.currentGroups;
    }
  },

  methods: {
    async showDialog() {
      this.dialog = true;
      this.loading = false;
      await this.initGroup();
    },
    async initGroup() {
      this.loading = true;
      await this.fetchGroups();
      this.totalRows = this.currentGroups.length;
      this.loading = false;
    },
    async selectGroup(e: any) {
      await this.addGroup(e);
      this.dialog = false;
      this.loading = true;
    },
    async handleOnSearch(value: string) {
      this.search = value;
      await this.initGroup();
    },
    onFiltered(filteredItems: any[]) {
      // Trigger pagination to update  the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },

    async handlePageChange(page: number) {
      try {
        const response = await commonService.getGroups({
          page,
          page_size: 10
        });

        if (response?.payload) {
          this.pagination = {
            currentPage: page,
            pageSize: 10,
            totalItems: response.count,
            totalPages: Math.ceil(response.count / 10)
          };
          this.currentGroups = response.payload || [];
        }
      } catch (e) {
        console.error(e);
        this.currentGroups = [];
      }
    },

    async fetchGroups() {
      try {
        const response = await commonService.getGroups({
          page: 1,
          page_size: 10,
          search: this.search
        });
        if (response?.payload) {
          this.pagination = {
            currentPage: 1,
            pageSize: 10,
            totalItems: response.count,
            totalPages: Math.ceil(response.count / 10)
          };
          this.currentGroups = response.payload || [];
        } else {
          this.currentGroups = [];
          this.pagination = {
            currentPage: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0
          };
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
});
