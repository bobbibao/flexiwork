import { defineComponent, ref, Ref } from "vue";
import currency from "currency.js";
import ApiService from "@/api/api.service";
import { Response } from "@/common/dtos";
import { Product } from "@/common/models/product.model";
import { PlusIcon } from "@/components/atoms";
import { ITablePagination } from "../../table/type";
import TableProduct from "@/components/organisms/TableProduct/TableProduct.vue";
import { CommonService } from "@/common/services";
import { ProductSetting } from "@/common/models/productSetting.model";
import SearchInput from "@/components/molecules/SearchInput/SearchInput.vue";

const commonService = new CommonService();

export default defineComponent({
  name: "ProductModal",
  components: {
    PlusIcon,
    TableProduct,
    SearchInput
  },
  props: {
    addProduct: {
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
          thStyle: { width: "40%" },
          tdClass: "text-wrap",
          thClass: "text-wrap"
        },
        {
          key: "description",
          label: this.$t("product.desc"),
          sortable: true,
          thStyle: { width: "35%" },
          tdClass: "text-wrap",
          thClass: "text-wrap"
        },
        {
          key: "unit",
          label: this.$t("product.unit"),
          sortable: false,
          thStyle: { width: "10%" }
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
          thStyle: { width: "10%" }
        }
      ],
      folders: [{ name: this.$t("status.all"), value: "" }],
      folder: "",

      currentProducts: [] as Product[],
      currentSettings: {
        product: {} as ProductSetting
      }
    };
  },
  computed: {
    products() {
      let arr = [] as Product[];
      for (const item of this.currentProducts) {
        item.price = this.formatMoney(Number(item.price) ?? 0);
        item.unit.display = this.$t(item.unit.description) as string;
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
      await this.fetchSettings();
      this.folders = [{ name: this.$t("status.all"), value: "" }];

      if (this.currentSettings.product && this.currentSettings.product.folders.length > 0) {
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
      await this.fetchProducts();
      this.totalRows = this.currentProducts.length;
      this.loading = false;
    },
    async selectProduct(e: any) {
      await this.addProduct(e);
      this.dialog = false;
      this.loading = true;
    },
    formatMoney(val: number) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    onFiltered(filteredItems: any[]) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },
    resetFolder() {
      this.folders = [{ name: this.$t("status.all"), value: "" }];
      this.folder = ""; // Reset the selected folder value as well
    },
    async fetchSettings() {
      try {
        const response = await commonService.getSetting();
        // const response = await ApiService.get<Response<any>>("setting"); // FIXME: Move to a service
        this.currentSettings.product = response?.product || {
          folders: [{ name: this.$t("status.all") as string, value: "" }]
        };
      } catch (e) {
        console.error(e);
        this.currentSettings.product.folders = [{ name: this.$t("status.all") as string, value: "" }];
      }
    },
    async handleOnSearch(value: string) {
      this.search = value;
      await this.initProduct();
    },

    async handlePageChange(page: number) {
      try {
        const response = await commonService.getProducts({
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
          this.currentProducts = response.payload || [];
        }
      } catch (e) {
        console.error(e);
        this.currentProducts = [];
      }
    },

    async fetchProducts() {
      try {
        const response = await commonService.getProducts({
          page: 1,
          page_size: 10,
          folder: this.folder,
          search: this.search
        });

        if (response?.payload) {
          this.pagination = {
            currentPage: 1,
            pageSize: 10,
            totalItems: response.count,
            totalPages: Math.ceil(response.count / 10)
          };
          this.currentProducts = response.payload || [];
        } else {
          this.currentProducts = [];
          this.pagination = {
            currentPage: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0
          };
        }
      } catch (e) {
        console.error(e);
        this.currentProducts = [];
      }
    }
  }
});
