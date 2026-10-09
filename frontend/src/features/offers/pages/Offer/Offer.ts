import { defineComponent, Ref, ref } from "vue";
import { OffersService } from "../../services";
import { TaskState } from "@/common/models";
import { PlusIcon, ButtonCustom, ButtonSwitch, SelectOption, Toast, getSelectedOption } from "@/components";
import { StatusFilterDropdown, SearchInput, TotalSum, OffersTable, BulkActionToolbar } from "../../components";
// @ts-ignore
import authModule from "@/core/services/store/auth.module";
import { ERouteQueryParams, getQueryParameter, PaginatedResponse, removeQueryParameter } from "@/common";
import { Offer } from "@/common/models/offers.model";
import { defaultStatusFilterOption, defaultStatuses } from "../../constants";
import * as router from "vue-router";

const offersService = new OffersService();

export default defineComponent({
  name: "OfferPage",
  components: {
    ButtonCustom,
    StatusFilterDropdown,
    SearchInput,
    TotalSum,
    ButtonSwitch,
    PlusIcon,
    OffersTable,
    BulkActionToolbar
  },
  metaInfo: {
    title: "Offer"
  },
  mixins: [Toast],
  setup() {
    const defaultPageSize = 10;
    const offers = ref<Offer[]>([]);
    const search = ref<string>("");
    const isCreate = ref<boolean>(false);
    const selectedStatus = ref<string | null>("active");
    const selectedOffers = ref<number[]>([]);
    const totalItems = ref<number>(0);
    const totalPages = ref<number>(0);
    const totalSumNet = ref<number>(0);
    const totalSumGross = ref<number>(0);
    const statusOptions: Ref<SelectOption[]> = ref<SelectOption[]>(defaultStatusFilterOption);
    const currentPage = Number(getQueryParameter(ERouteQueryParams.PAGE)) || 1;

    const fetchOffers = async () => {
      const fetchedOffers = await offersService.getOffers({
        status: "active",
        page: currentPage ? +currentPage : 1,
        page_size: defaultPageSize
      });
      totalSumNet.value = fetchedOffers?.total_sum_net || 0;
      totalSumGross.value = fetchedOffers?.total_sum_gross || 0;
      totalItems.value = fetchedOffers?.total_items || 0;
      totalPages.value = fetchedOffers?.total_pages || 0;
      offers.value = fetchedOffers?.detailedOffers || [];
    };

    return {
      offers,
      totalSumGross,
      totalPages,
      totalSumNet,
      defaultPageSize,
      currentPage,
      search,
      totalItems,
      statusOptions,
      isCreate,
      selectedStatus,
      selectedOffers,
      fetchOffers
    };
  },
  data() {
    return {
      currentUser: authModule.state.user,
      isDrawerVisible: false,
      sortOffers: "",
      fetchingListOffers: false,
      statuses: [] as TaskState[]
    };
  },
  async mounted() {
    this.statuses = defaultStatuses;
    await this.fetchOffers();
  },
  methods: {
    getStatus() {
      return this.selectedStatus || "all";
    },

    async fetchData(isResetPagination: boolean = false, action?: string) {
      if (isResetPagination) {
        removeQueryParameter(ERouteQueryParams.PAGE);
      }
      this.currentPage = Number(getQueryParameter(ERouteQueryParams.PAGE)) || 1;
      this.fetchingListOffers = true;
      const page = getQueryParameter(ERouteQueryParams.PAGE) || 1;

      const response = await offersService.getOffers({
        status: this.getStatus(),
        search: this.search,
        page: page ? +page : 1,
        page_size: this.defaultPageSize,
        sort: this.sortOffers
      });

      //recalculate total pages
      if (action == "filter") {
        this.totalItems = response?.total_items || 0;
        this.totalPages = response?.total_pages || 0;
      }
      //recalculate sum
      if (action == "Archive" || action == "Active") {
        this.totalItems = response?.total_items || 0;
        this.totalPages = response?.total_pages || 0;
        if (action == "Active") {
          this.totalSumGross = response?.total_sum_gross || 0;
          this.totalSumNet = response?.total_sum_net || 0;
        }
      }
      //recalculate sum after bulk delete
      if (action == "bulk") {
        if (this.getStatus() == "archive") {
          this.totalItems = response?.total_items || 0;
          this.totalPages = response?.total_pages || 0;
        } else {
          this.totalSumGross = response?.total_sum_gross || 0;
          this.totalSumNet = response?.total_sum_net || 0;
          this.totalItems = response?.total_items || 0;
          this.totalPages = response?.total_pages || 0;
        }
      }

      if (action == "copy") {
        if (this.getStatus() == "archive" || this.getStatus() == "deleted") {
          this.totalItems = response?.total_items || 0;
          this.totalPages = response?.total_pages || 0;
          this.selectedStatus = "all";
          this.fetchData(true, "copy");
        } else {
          this.totalItems = response?.total_items || 0;
          this.totalPages = response?.total_pages || 0;
          this.totalSumGross = response?.total_sum_gross || 0;
          this.totalSumNet = response?.total_sum_net || 0;
        }
      }

      if (action == "search") {
        this.totalItems = response?.total_items || 0;
        this.totalPages = response?.total_pages || 0;
      }
      if (response) {
        this.offers = response.detailedOffers || [];
      }
      this.fetchingListOffers = false;
    },

    async handleOnSortOffers(order: string) {
      this.sortOffers = order;
      await this.fetchData(true);
    },

    async handleOnSearch(value: string) {
      this.search = value;
      await this.fetchData(true, "search");
    },

    async handleOnDeleteOffer({ offerId, status }: { offerId: number; status: string }) {
      try {
        await offersService.deleteOffer(offerId);

        await this.fetchData(true, status);
        this.toast("Offer has been deleted successfully!", "success");
      } catch (error) {
        this.toast("Unable to delete Offers!", "danger");
      }
    },

    updateSelectedOffers(offerId: number, add: boolean) {
      if (add) {
        if (!this.selectedOffers.includes(offerId)) {
          this.selectedOffers.push(offerId);
        }
      } else {
        const offerIndex = this.selectedOffers.indexOf(offerId);
        if (offerIndex > -1) {
          this.selectedOffers.splice(offerIndex, 1);
        }
      }
    },

    handleSelectOffer(event: boolean, offer: Offer | null) {
      if (!offer) return;
      this.updateSelectedOffers(offer.id, event);
    },

    handleSelectAllOffers(event: boolean, listOffer: Offer[]) {
      listOffer.forEach(offer => {
        this.updateSelectedOffers(offer.id, event);
      });
    },
    async handleOnOpenDetail(offer: Offer | null) {
      if (offer) {
        this.goTo(`/offer/${offer.id}`);
      }
    },
    async handleDeleteBulk(listIds: number[]) {
      try {
        const result = await offersService.bulkDeleteOffer(listIds.map(id => Number(id)));
        if (result.error === false) {
          this.toast("Bulk delete items successful!", "success");
          await this.fetchData(true, "bulk");
          this.selectedOffers.splice(0, this.selectedOffers.length);
        }
      } catch (error) {
        this.toast("Unable to delete Offers!", "danger");
      }
    },

    async handleStatusFilterChanged(options: SelectOption[]) {
      const selectedOption = getSelectedOption(options);
      this.selectedStatus = selectedOption ? selectedOption.value : null;
      this.statusOptions = options;
      this.selectedOffers = [];
      await this.fetchData(true, "filter");
    },

    async handleOnPrintOffer(id: number) {
      await offersService.printOffer(id);
    },

    async handleOnCopyOffer(id: number) {
      try {
        const result = await offersService.copyOffer(id);
        this.toast(this.$t("msg.copySuccess").toString(), "success");

        if (result.error === false) {
          await this.fetchData(true, "copy");
        }
      } catch (error) {
        console.error("Error during copy offer:", error);
        this.toast("Unable to copy the item.", "danger");
      }
    },

    async handleCopyBulk(listIds: number[]) {
      try {
        const deletePromises = listIds.map(id => offersService.copyOffer(id));
        const results = await Promise.all(deletePromises);

        const allSuccessful = results.every(result => result.error === false);

        if (allSuccessful) {
          this.toast("Bulk copy items successful!", "success");
          await this.fetchData(true, "copy");
          this.selectedOffers.splice(0, this.selectedOffers.length);
        } else {
          this.toast("Some items could not be copied.", "danger");
        }
      } catch (error) {
        console.error("Error during bulk copy:", error);
        this.toast("Unable to bulk copy Offers!", "danger");
      }
    },

    async handlePrintBulk(listIds: number[]) {
      try {
        await offersService.bulkPrintOffer(listIds);
        this.toast("Bulk print initiated!", "success");
      } catch (error) {
        console.error("Error during bulk print:", error);
        this.toast("Unable to print Offers!", "danger");
      }
    },

    async handleToggleOfferStatus(id: number) {
      try {
        await offersService.toggleOfferStatus(id);
        this.toast("Update offer status successful!", "success");
        await this.fetchData(true);
      } catch (error) {
        this.toast("Unable to update offer status!", "danger");
      }
    },

    goTo(pathName: string) {
      this.$router.push(pathName);
    }
  }
});
