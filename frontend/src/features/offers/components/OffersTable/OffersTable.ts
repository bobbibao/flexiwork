import { formatDate, PaginatedResponse, truncateByWords, countWordsInText } from "@/common";
import { Offer } from "@/common/models/offers.model";
import {
  ButtonCustom,
  ITableDefaultFunctions,
  ITableField,
  ITablePagination,
  SeverityBadge,
  SortIcon,
  TrashDetailedIcon,
  CopyIcon,
  PrintIcon,
  ConfirmModal
} from "@/components";
import { computed, defineComponent, PropType, ref, Ref } from "vue";
import TableOverview from "../TableOverview/TableOverview.vue";
import { defaultStatuses } from "../../constants/statuses.constant";
import currency from "currency.js";
import i18nService from "@/core/services/i18n.service.js";

export interface IOfferItem {
  id: number | string;
  companyName: string;
  project: string;
  projectNbr: number | string;
  sumNet: number;
  sumGross: number;
  date: Date | null;
  status: {
    label: string;
    color: string;
  };
}

export default defineComponent({
  name: "OffersTable",
  components: {
    TableOverview,
    ButtonCustom,
    SortIcon,
    ConfirmModal,
    TrashDetailedIcon,
    SeverityBadge,
    CopyIcon,
    PrintIcon
  },
  props: {
    offersData: {
      type: Array as PropType<Array<Offer>>,
      default: () => ({}),
      required: true
    },
    totalItems: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    currentPage: {
      type: Number,
      default: 1,
      required: true
    },
    selectedOffers: {
      type: Array as PropType<number[]>,
      default: () => [],
      required: true
    },
    fetchingData: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: String,
      default: ""
    }
  },
  emits: {
    onSort: (order: string) => {},
    onOpenDetail: (offer: Offer | null) => {},
    onOfferChangePage: () => {},
    onSelectOffer: (event: boolean, offer: Offer | null) => {},
    toggleSelectAllOffersInTable: (event: boolean, listOffers: Offer[]) => {},
    onDeleteOffer: (payload: { offerId: number; status: string }) => {},
    onPrint: (id: number) => {},
    onCopy: (id: number) => {},
    onToggleOfferStatus: (id: number) => {}
  },
  setup() {
    const currentLanguage = computed(() => i18nService.getActiveLanguage());

    const fields: ITableField[] = [
      { key: "checkBox" },
      { key: "companyName", label: "Company/Name" },
      { key: "project", label: "Project" },
      { key: "projectNbr", label: "Project Number", thStyle: { textAlign: "right" }, tdClass: "text-right" },
      {
        key: "sum",
        label: currentLanguage.value === "en" ? "Sum" : "Summe"
      },
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
      { key: "formCheckbox", label: "", thStyle: { width: "20px" } },
      { key: "actions", label: "", thStyle: { width: "50px" } }
    ];

    const tableDefault: Ref<ITableDefaultFunctions | null> = ref(null);
    const listOffers: Ref<IOfferItem[]> = ref<IOfferItem[]>([]);
    const pagination: Ref<ITablePagination | undefined> = ref<ITablePagination>();

    return {
      fields,
      tableDefault,
      listOffers,
      pagination,
      currentLanguage
    };
  },
  methods: {
    formatDate(date: Date, format: string) {
      return formatDate(date, format);
    },

    formatMoney(vallue: number) {
      return currency(vallue, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },

    handleChangePage() {
      this.$emit("onOfferChangePage");
    },

    areAllOffersInTableSelected() {
      return (
        this.offersData &&
        this.offersData.length > 0 &&
        this.selectedOffers.length > 0 &&
        this.selectedOffers.length === this.offersData.length
      );
    },

    openDetail(offerItem: IOfferItem[]) {
      if (offerItem.length === 0) {
        return;
      }

      const selectedOffer = this.offersData.find(offer => offer.id === offerItem[0].id) || null;

      if (this.tableDefault && typeof this.tableDefault.clearSelected === "function") {
        this.tableDefault.clearSelected();
      }
      this.$emit("onOpenDetail", selectedOffer);
    },

    handleAllRowSelected(event: boolean) {
      this.$emit("toggleSelectAllOffersInTable", event, this.offersData);
    },

    handleSelectRow(event: boolean, offerId: number) {
      const offer = this.offersData.find(offer => offer.id === offerId) ?? null;
      this.$emit("onSelectOffer", event, offer);
    },

    deleteOffer(offerId: number, status: string) {
      this.$emit("onDeleteOffer", { offerId, status });
    },

    handleSort(field: string) {
      if (!this.offersData || this.offersData.length === 0) {
        return;
      }
      const { sortOrder } = this.updateSortOrder(this.sortOrder, field);

      this.$emit("onSort", sortOrder);
    },

    handlePrint(id: number) {
      this.$emit("onPrint", id);
    },

    handleCopy(id: number) {
      this.$emit("onCopy", id);
    },

    updateSortOrder(currentOrder: string, field: string) {
      let [currentOrderField, currentFieldDirection] = currentOrder.split(":");
      if (currentOrderField === field) {
        currentFieldDirection = currentFieldDirection === "asc" ? "desc" : "asc";
      } else {
        currentFieldDirection = "asc";
      }

      return { sortOrder: `${field}:${currentFieldDirection}`, sortType: currentFieldDirection };
    },

    onToggleOfferStatus(offerId: number) {
      this.$emit("onToggleOfferStatus", offerId);
    }
  },
  watch: {
    offersData(newValue: Offer[]) {
      if (!newValue) {
        return;
      }
      if (Array.isArray(newValue) && newValue.length > 0) {
        this.listOffers = this.offersData.map(offer => {
          const status = defaultStatuses.find(s => s.value === offer.status);
          return {
            id: offer.id,
            companyName: offer.customer.company
              ? offer.customer.company
              : offer.customer.first_name || offer.customer.last_name
              ? `${offer.customer.first_name || ""}, ${offer.customer.last_name || ""}`
              : offer.customer.details?.company
              ? offer.customer.details.company
              : offer.customer.details?.first_name || offer.customer.details?.last_name
              ? `${offer.customer.details.first_name || ""}, ${offer.customer.details.last_name || ""}`
              : "Unknown",
            project: offer.name + (offer.details?.location ? ", " + offer.details.location : ""),
            projectNbr: offer.number?.custom_id ? offer.number.custom_id : offer.number.id,
            sumNet: offer.detail_cost.total_net + offer.detail_cost.total_net_nk,
            sumGross: offer.detail_cost.total_gross + offer.detail_cost.total_gross_nk,
            date: offer.details?.date ? new Date(offer.details?.date) : null,
            status: {
              label: status ? status.label.charAt(0).toUpperCase() + status.label.slice(1).toLowerCase() : "",
              value: status ? status.value : "",
              color: status ? status.color : ""
            }
          };
        });
        this.pagination = {
          currentPage: this.currentPage,
          pageSize: 10,
          totalItems: this.totalItems,
          totalPages: this.totalPages
        };
      } else {
        this.listOffers = [];
        this.pagination = undefined;
      }
    }
  },
  mounted() {}
});
