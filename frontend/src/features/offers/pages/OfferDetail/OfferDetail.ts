import { defineComponent, Ref, ref } from "vue";
import {
  ButtonCustom,
  ContentEditor,
  SearchableDropdown,
  SelectOption,
  QuoteItems,
  InternalDesc,
  Trash2,
  Eye,
  ConfirmModal,
  Toast,
  EditableTitle
} from "@/components";
import { EventTable } from "@/features/offers/components";
import Accordion from "@/components/atoms/Accordion/Accordion.vue";
import ChevronLeft from "@/components/atoms/Icons/ChevronLeft.vue";
import { OffersService } from "../../services";
// @ts-ignore
import { Customer } from "@/common/models/customer.model";
import CustomerSelector from "@/components/organisms/selector/CustomerModal/CustomerModal.vue";
import i18nService from "@/core/services/i18n.service.js";
import currency from "currency.js";
import { OfferCostGenerate } from "@/common/models/offerCostGenerate.model";
import { Offer } from "@/common/models/offers.model";
import { OfferQuoteItem } from "@/common/models/offerQuoteItem.model";
import { OfferEvent } from "@/common/models/offerEvent.model";
import { CreateOfferDto } from "@/common/dtos/createOffer.dto";
import AdditionalCosts from "@/components/organisms/selector/AdditionalCosts/AdditionalCosts";
import { AdditionalOption } from "@/components/organisms/selector/AdditionalCosts/type";
import { Vat } from "@/components/organisms/QuoteItems/type";
import ApiService from "@/api/api.service";
import { Response } from "@/common/dtos";
import { OfferDetail } from "@/common/models/offerDetail.model";
import { OfferSetting } from "@/common/models/offerSetting.model";
import { formatDate } from "@/common";

const offersService = new OffersService();

export default defineComponent({
  name: "OfferDetail",
  props: {},
  components: {
    ButtonCustom,
    ChevronLeft,
    Trash2,
    Eye,
    Accordion,
    ContentEditor,
    SearchableDropdown,
    EventTable,
    QuoteItems,
    CustomerSelector,
    InternalDesc,
    AdditionalCosts,
    ConfirmModal,
    EditableTitle
  },
  metaInfo: {
    title: "Offer Detail"
  },
  mixins: [Toast],
  setup() {
    const currentVatRates = ref<Vat[]>([]);
    return { currentVatRates };
  },
  data() {
    const subtitleOptions: { label: string }[] = [];
    const defaultKmOptions: SelectOption[] = [];
    const defaultAdditionalOptions: Array<AdditionalOption> = [];
    const additionalCost: { push_nk: boolean; percent: number } = { push_nk: false, percent: 0 };
    const defaultInternalDesc: Array<{ label: string; is_active: boolean }> = [
      "Pauschale",
      "Nach Baukosten",
      "Kostendach",
      "Nach Aufwand",
      "RG nach Phasen",
      "RG Monatlich",
      "RG Quartal",
      "RG nach Abschluss"
    ].map(label => ({ label, is_active: false }));

    const originalOffer: Ref<Offer | undefined> = ref<Offer | undefined>(undefined);
    const currentOffer = {
      name: "",
      status: "",
      customer: null as Customer | null,
      location: "",
      date: new Date().toISOString(),
      date_formatted: "",
      title: "Honorarofferte",
      subtitle: "",
      begin_desc: "",
      performance_desc: "",
      parameter_desc: "",
      offer_desc: "",
      begin_break: false,
      performance_break: false,
      parameter_break: false,
      offer_break: false,
      offer_quote_break: false,
      additional_break: false,
      event_break: false,
      cost_estimate: [] as { label: string; value: number; order: string; id?: string }[],
      end_desc: "",
      internal_desc: defaultInternalDesc,
      internal_desc_custom: "",
      events: [] as { label: string; value: string }[],
      cost_generate: {} as OfferCostGenerate,
      quote_items: [] as OfferQuoteItem[],
      currency_val: "",
      begin: "", // section 1
      performance: "", // section 2
      estimate_cost: "", // section 3a
      parameter: "", // section 3b
      offer: "", // section 4
      additional: "", // section 5
      event: "", // section 6
      end: "", // section 7
      additional_desc: "",
      discount_percent: 0.0
    };

    return {
      vat: [] as number[],
      validation: {
        name: {
          required: true,
          valid: true,
          touched: false,
          message: ""
        },
        location: {
          required: true,
          valid: true,
          touched: false,
          message: ""
        },
        title: {
          required: true,
          valid: true,
          touched: false,
          message: ""
        }
      },
      locale: "de",
      currentOffer,
      originalOffer,
      subtitleOptions,
      defaultKmOptions,
      defaultAdditionalOptions,
      defaultInternalDesc,
      dialogVisible: false,
      searchQuery: "",
      selectedCustomer: null as Customer | null,
      customers: [] as Customer[],
      totalSum: 0.0,
      genType: false,
      currentCompany: { currency: "", name: "" },
      selected_km_label: "",
      loading: true,
      isSaving: false,
      additionalCost,
      default_vat: 0.0,
      acceptDialog: false,
      acceptDate: new Date().toISOString(), // set to current date
      acceptDateFormatted: ""
    };
  },
  async mounted() {
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }

    this.calculateTotalSum();
    await this.fetchVatRates();
    await this.fetchCompany();
    await this.fetchOffer();

    if (this.originalOffer?.currency) {
      this.currentOffer.currency_val = this.originalOffer.currency;
    } else {
      this.currentOffer.currency_val = this.currentCompany.currency;
    }
  },
  computed: {
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    calculateVat() {
      for (const vat of this.currentVatRates) {
        this.vat.push(vat.rate);
        if (vat.is_default) {
          this.default_vat = vat.rate;
        }
      }
      return this.default_vat;
    },
    filteredCustomers(): Customer[] {
      const query = this.searchQuery.toLowerCase();
      return this.customers.filter((customer: Customer) =>
        [
          customer.company,
          customer.details.address,
          customer.details.postcode,
          customer.details.place,
          customer.first_name,
          customer.last_name
        ]
          .filter(Boolean)
          .some(field => field.toLowerCase().includes(query))
      );
    },
    offerId(): string | null {
      return (this.$route.params.offer_id as string) || null;
    }
  },
  watch: {
    "$route.params.id": {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.fetchOffer();
        }
      }
    },
    "currentOffer.name"(newValue: string) {
      this.validateField("name", newValue);
    },
    "currentOffer.location"(newValue: string) {
      this.validateField("location", newValue);
    },
    "currentOffer.title"(newValue: string) {
      this.validateField("title", newValue);
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.allowSubmit() || this.isSaving) {
        return;
      }

      const fieldsToValidate = [
        { field: "name", value: this.currentOffer.name, elementId: "offerTitle" },
        { field: "location", value: this.currentOffer.location, elementId: "offerLocation" },
        { field: "title", value: this.currentOffer.title, elementId: "offerType" }
      ];

      let isValid = true;

      for (const item of fieldsToValidate) {
        this.validateField(item.field, item.value);
        if (!this.validation[item.field as keyof typeof this.validation].valid) {
          isValid = false;
          this.scrollToElement(item.elementId);
          break;
        }
      }

      if (!isValid) {
        return;
      }

      this.isSaving = true;
      const data: CreateOfferDto = this.prepareOfferData();

      try {
        if (this.offerId) {
          await this.updateOffer(data);
          this.toast("Offer updated successfully", "success");
        } else {
          if (!this.validateForm()) {
            this.isSaving = false;
            return;
          }

          if (!this.currentOffer.customer) {
            this.toast(this.$t("msg.noCustomer") as string, "danger");
            this.isSaving = false;
            return;
          }
          await offersService.createOffer(data);
          this.toast("Offer created successfully!", "success");
        }

        // Only redirect after successful save
        await this.$nextTick();
        this.$router.push("/offer").catch(() => {
          this.isSaving = false;
        });
      } catch (error) {
        this.toast("Failed to create offer!", "danger");
        console.error("Failed to create offer:", error);
        this.isSaving = false;
      }
    },
    async fetchOffer() {
      try {
        const offerId = this.offerId;
        const offerSetting = (await offersService.getOfferSettings()) as OfferSetting;

        if (offerId) {
          const offer = (await offersService.getOffer(Number(offerId))) as Offer;

          this.originalOffer = offer;
          this.populateOfferDetails(offer);
          if (offer.details && "additional_cost" in offer.details && Array.isArray(offer.details["additional_cost"])) {
            this.defaultAdditionalOptions = offer.details["additional_cost"].map(item => ({
              id: item.id,
              offer_id: item.offer_id,
              label: String(item.label),
              is_active: item.is_active,
              value: String(item.value)
            }));
          } else {
            this.defaultAdditionalOptions = (offerSetting.add_cost_setting || []).map(item => ({
              id: null,
              offer_id: null,
              is_active: false,
              value: String(item.value),
              label: String(item.label)
            }));
          }

          this.defaultKmOptions = ((offerSetting.km_dropdown_setting as unknown) as SelectOption[]) || [];
          this.selected_km_label = offer?.details?.km_dropdown?.label || (offer?.details?.selected_km_label as string);
          this.subtitleOptions = offerSetting.subtitle_setting || [];
          for (const item of this.currentOffer.quote_items) {
            if (item.type === "individual" && !item.optional) {
              if (typeof item.is_nk === "string" ? item.is_nk === "true" : item.is_nk) {
                const addPercent = item.name?.toString() || "";
                const matches = addPercent.toString().match(/\d+(?:\.\d+)?%$/);
                if (matches) {
                  this.additionalCost.percent = parseFloat(matches[0]);
                }
              }
            }
          }
        } else {
          this.currentOffer.begin_desc = offerSetting.begin_desc || "";
          this.currentOffer.performance_desc = offerSetting.performance_desc || "";
          this.currentOffer.end_desc = offerSetting.end_desc || "";
          this.currentOffer.offer_desc = offerSetting.offer_desc || "";
          this.currentOffer.cost_generate =
            (offerSetting.generate_setting as OfferCostGenerate) || ({} as OfferCostGenerate);
          this.currentOffer.cost_estimate = Array.isArray(offerSetting.estimate_setting)
            ? offerSetting.estimate_setting.map(setting => ({
                label: setting.label || "",
                value: setting.value || 0,
                order: setting.id?.toString() || ""
              }))
            : [];
          this.currentOffer.events = offerSetting.event_setting || [];
          this.defaultKmOptions = ((offerSetting.km_dropdown_setting as unknown) as SelectOption[]) || [];
          this.defaultAdditionalOptions = ((offerSetting.add_cost_setting as unknown) as AdditionalOption[]) || [];
          this.currentOffer.begin = offerSetting?.begin || ""; // section 1
          this.currentOffer.performance = offerSetting?.performance || ""; // section 2
          this.currentOffer.estimate_cost = offerSetting?.estimate_cost || "";
          this.currentOffer.parameter = offerSetting?.parameter || ""; // section 3b
          this.currentOffer.offer = offerSetting?.offer || ""; // section 4
          this.currentOffer.additional = offerSetting?.additional || ""; // section 5
          this.currentOffer.event = offerSetting?.event || ""; // section 6
          this.currentOffer.end = offerSetting?.end || "";
          this.currentOffer.additional_desc = offerSetting.additional_desc || "";
          this.selected_km_label = String(this.defaultKmOptions[0].label);
          this.subtitleOptions = offerSetting.subtitle_setting || [];
          this.currentOffer.subtitle = this.subtitleOptions[0]?.label || "";
        }

        this.calculateTotalSum();
        this.loading = false;
      } catch (error) {
        this.loading = true;
        console.error("Failed to fetch offer:", error);
      }
    },
    async handleGenerateProducts() {
      const q: string = this.genType ? "hours" : "full_price";
      try {
        const {
          quote_items: generatedQuoteItems = [],
          offer_desc: generatedOfferDesc = ""
        } = await offersService.generateProducts(this.currentOffer.cost_generate, q);

        if (generatedQuoteItems && generatedQuoteItems.length) {
          const omittedQuoteItems: Omit<OfferQuoteItem, "id">[] = generatedQuoteItems.map(
            ({ id, ...others }) => others
          );
          this.currentOffer.quote_items.push(...omittedQuoteItems);
          this.$nextTick(() => {
            // Wait for the DOM to update
            this.scrollToElement("quote-items");
          });
        }

        if (generatedOfferDesc) {
          this.currentOffer.offer_desc = generatedOfferDesc;
        }
      } catch (error) {
        console.error("Failed to generate products:", error);
      }
    },
    async handleDeleteOffer() {
      if (!this.offerId) {
        this.toast("No offer to delete!", "danger");
        return;
      }
      try {
        await offersService.deleteOffer(Number(this.offerId));
        this.toast("Offer deleted successfully!", "success");
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait for the toast to disappear
        this.$router.push("/offer");
      } catch (error) {
        this.toast("Failed to delete offer!", "danger");
        console.error("Failed to delete offer:", error);
      }
    },
    async handlePreviewPdf() {
      if (!this.offerId) {
        this.toast("No offer to preview!", "danger");
        return;
      }
      try {
        await offersService.printOffer(Number(this.offerId), "pdf", true);
      } catch (error) {
        this.toast("Failed to generate PDF preview!", "danger");
        console.error("Failed to generate PDF preview:", error);
      }
    },
    async handleCopyOffer() {
      try {
        const result = await offersService.copyOffer(Number(this.offerId));
        if (result.error === false) {
          this.toast("Offer copied successfully", "success");
          setTimeout(() => {
            this.goTo(`/offer`);
          }, 1000);
        }
      } catch (error) {
        this.toast("Failed to copy offer", "danger");
        console.error("Failed to copy offer:", error);
      }
    },
    async handleSendMail() {
      try {
        const ID_TOKEN_KEY = "access_token";
        const getToken = localStorage.getItem(ID_TOKEN_KEY);
        const pdfLink = `${process.env.VUE_APP_API_URL}/api/export/preview?id=${this.offerId}&type=offer&code=${getToken}`;
        const body =
          this.$t("email.salutation") +
          "\n\n" +
          this.$t("email.offerIntro") +
          " " +
          pdfLink +
          "\n" +
          this.$t("email.offerEnd") +
          "\n\n" +
          this.$t("email.end") +
          "\n" +
          this.currentCompany.name;
        const subject = this.$t("menu.offer");
        window.open(
          `mailto:${this.selectedCustomer?.email || ""}:?subject=${subject}&body=${encodeURIComponent(body)}`
        );
      } catch (error) {
        console.error("Failed to send mail:", error);
      }
    },
    async handlePrintPdf() {
      try {
        await offersService.printOffer(Number(this.offerId));
      } catch (error) {
        console.error("Failed to print offer:", error);
      }
    },
    async handlePrintDocx() {
      try {
        await offersService.printOffer(Number(this.offerId), "docx");
      } catch (error) {
        console.error("Failed to print offer docx:", error);
      }
    },
    async handleAcceptOffer() {
      try {
        const payload = {
          end_on: this.acceptDate
        };
        const result = await offersService.acceptOffer(Number(this.offerId), payload);
        if (result.error === false) {
          this.toast("Offer accepted successfully", "success");
          setTimeout(() => {
            this.goTo(`/project/${result.payload.project_id}`);
          }, 1000);
        }
      } catch (error) {
        this.toast("Failed to accept offer", "danger");
        console.error("Failed to accept offer:", error);
      } finally {
        this.acceptDialog = false;
      }
    },
    updateCostGenerate(id: string, value: string) {
      const element = document.getElementById(id);
      if (element) {
        type CostGenerateKeys = keyof OfferCostGenerate;
        const label: string = this.currentOffer.cost_generate[id as CostGenerateKeys].label;
        this.$set(this.currentOffer.cost_generate, id, { label, value });
      }
    },
    populateOfferDetails(offer: Offer) {
      const details = offer.details || ({} as OfferDetail);

      Object.assign(this.currentOffer, {
        name: offer?.name || "",
        status: offer?.status || "",
        quote_items: details?.quote_items || [],
        customer: offer?.customer || null,
        title: details?.title || "",
        location: details?.location || "",
        date: details?.date ? new Date(details.date).toISOString() : "",
        subtitle: details?.category || "",
        begin_desc: details?.begin_desc || "",
        performance_desc: details?.performance_desc || "",
        parameter_desc: details?.parameter_desc || "",
        begin_break: details?.begin_break || false,
        performance_break: details?.performance_break || false,
        parameter_break: details?.parameter_break || false,
        offer_break: details?.offer_break || false,
        offer_quote_break: details?.offer_quote_break || false,
        additional_break: details?.additional_break || false,
        event_break: details?.event_break || false,
        events: details?.events || [],
        end_desc: details?.end_desc || "",
        internal_desc: details?.internal_desc || [],
        internal_desc_custom: details?.internal_desc_custom || "",
        cost_estimate: details?.cost_estimate || [],
        cost_generate: details?.cost_generate || {},
        currency_val: offer?.currency || "",
        additional_desc: details?.additional_desc || "",
        offer_desc: details?.offer_desc || "",
        begin: details?.begin || "", // section 1
        performance: details?.performance || "", // section 2
        estimate_cost: details?.estimate_cost || "", // section 3a
        parameter: details?.parameter || "", // section 3b
        offer: details?.offer || "", // section 4
        additional: details?.additional || "", // section 5
        event: details?.event || "", // section 6
        end: details?.end || "", // section 7
        discount_percent: details?.discount_percent ? parseFloat(details.discount_percent.toString()) : 0.0
      });
    },

    prepareOfferData(): CreateOfferDto {
      return {
        name: this.currentOffer.name,
        customer: this.currentOffer.customer ?? ({} as Customer),
        location: this.currentOffer.location,
        date: this.currentOffer.date,
        title: this.currentOffer.title,
        category: this.currentOffer.subtitle,
        begin: this.currentOffer.begin,
        parameter: this.currentOffer.parameter,
        end: this.currentOffer.end,
        additional: this.currentOffer.additional,
        additional_break: this.currentOffer.additional_break ?? false,
        additional_cost: this.defaultAdditionalOptions,
        additional_desc: this.currentOffer.additional_desc,
        begin_break: this.currentOffer.begin_break ?? false,
        begin_desc: this.currentOffer.begin_desc,
        cost_estimate: this.currentOffer.cost_estimate,
        cost_generate: this.currentOffer.cost_generate,
        currency: this.currentOffer.currency_val,
        discount_percent: this.currentOffer.discount_percent,
        end_desc: this.currentOffer.end_desc,
        estimate_cost: this.currentOffer.estimate_cost,
        event: this.currentOffer.event,
        event_break: this.currentOffer.event_break ?? false,
        events: this.currentOffer.events,
        internal_desc: this.currentOffer.internal_desc,
        internal_desc_custom: this.currentOffer.internal_desc_custom,
        km_dropdown: {
          label: this.selected_km_label,
          value: Number(this.defaultKmOptions.find(option => option.label === this.selected_km_label)?.value) || 0
        },
        offer: this.currentOffer.offer,
        offer_break: this.currentOffer.offer_break ?? false,
        offer_desc: this.currentOffer.offer_desc,
        offer_quote_break: this.currentOffer.offer_quote_break ?? false,
        parameter_break: this.currentOffer.parameter_break ?? false,
        performance: this.currentOffer.performance,
        parameter_desc: this.currentOffer.parameter_desc,
        performance_break: this.currentOffer.performance_break ?? false,
        performance_desc: this.currentOffer.performance_desc,
        quote_items: this.currentOffer.quote_items
      };
    },
    handleBlur(index: number) {
      this.calculateTotalSum();
    },
    formatDate() {
      if (this.currentOffer.date) {
        this.currentOffer.date_formatted = formatDate(this.currentOffer.date);
      }
    },
    formatMoney(val: number) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    formatDateInvert() {
      if (this.currentOffer.date_formatted) {
        const split = this.currentOffer.date_formatted.split("-");
        const join = split[2] + "." + split[1] + "." + split[0];
        this.currentOffer.date = join;
      }
    },
    isEdited() {},
    goTo(pathName: string) {
      this.$router.push(pathName);
    },
    openCustomerSelector() {
      this.resetCustomerSearch();
      this.fetchCustomers();
      this.dialogVisible = true;
    },
    resetCustomerSearch() {
      this.searchQuery = "";
    },
    updateSearchQuery(query: string) {
      this.searchQuery = query;
    },
    selectCustomer(customer: Customer) {
      this.selectedCustomer = customer;
    },
    confirmCustomerSelection() {
      if (this.selectedCustomer) {
        this.currentOffer.customer = this.selectedCustomer;
        this.dialogVisible = false;
      }
    },
    cancelCustomerSelection() {
      this.selectedCustomer = null;
      this.currentOffer.customer = null;
      this.dialogVisible = false;
    },
    checkArchived() {
      if (this.originalOffer?.status === "archive") {
        return true;
      } else {
        return false;
      }
    },
    updateQuoteItems(quoteItems: OfferQuoteItem[]) {
      this.$set(this.currentOffer, "quote_items", quoteItems);
    },
    async fetchCustomers() {
      try {
        this.customers = (await offersService.getCustomers()) as Customer[];
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    },
    calculateTotalSum() {
      if (!Array.isArray(this.currentOffer.cost_estimate)) {
        this.totalSum = 0;
        return;
      }

      this.totalSum = this.currentOffer.cost_estimate.reduce((sum, item) => {
        const value = typeof item.value === "number" ? item.value : parseFloat(String(item.value || "0"));
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    },
    async fetchCompany() {
      try {
        this.currentCompany = await offersService.getCompany();
      } catch (error) {
        console.error("Failed to fetch company:", error);
      }
    },
    toggleGenType() {
      this.genType = !this.genType;
    },
    updateEvents(newEvents: OfferEvent[]) {
      this.$set(this.currentOffer, "events", newEvents);
    },
    updateEventBreak() {
      this.currentOffer.event_break = !this.currentOffer.event_break;
    },
    toggleBreak(key: string) {
      const castedKey = key as keyof typeof this.currentOffer;
      this.$set(this.currentOffer, castedKey, !this.currentOffer[castedKey]);
    },
    async updateOffer(data: CreateOfferDto) {
      try {
        const response = await offersService.updateOffer(Number(this.offerId), data);
      } catch (error) {
        throw new Error(`[ERROR] UPDATE_OFFER: ${error}`);
      }
    },
    async fetchVatRates() {
      try {
        const response = await ApiService.get<Response<Vat[]>>("vatrates"); // FIXME: Move to a service
        this.currentVatRates = response.data.payload || [];
      } catch (e) {
        console.error(e);
      }
    },
    addQuoteItem(additionalPercent: number) {
      this.additionalCost = { push_nk: true, percent: additionalPercent };
      this.scrollToElement("quote-items");
    },
    scrollToElement(elementId: string) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        // Optional: Add focus for accessibility
        element.focus();
      }
    },
    validateField(field: string, value: string): void {
      const validation = this.validation[field as keyof typeof this.validation];
      validation.touched = true;

      switch (field) {
        case "name":
          validation.valid = !!value?.trim();
          validation.message = validation.valid ? "" : (this.$t("msg.required") as string);
          break;

        case "location":
          validation.valid = !!value?.trim();
          validation.message = validation.valid ? "" : (this.$t("msg.required") as string);
          break;

        case "title":
          validation.valid = !!value?.trim();
          validation.message = validation.valid ? "" : (this.$t("msg.required") as string);
          break;
      }
    },
    validateForm(): boolean {
      this.validateField("name", this.currentOffer.name);
      this.validateField("location", this.currentOffer.location);
      this.validateField("title", this.currentOffer.title);

      return this.validation.name.valid && this.validation.location.valid && this.validation.title.valid;
    },
    formatAcceptDate() {
      if (this.acceptDate) {
        this.acceptDateFormatted = formatDate(this.acceptDate);
      }
    },
    formatAcceptDateInvert() {
      if (this.acceptDateFormatted) {
        const split = this.acceptDateFormatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.acceptDate = join;
      }
    },
    allowSubmit() {
      // If inside create mode (this.offerId is `null`) or editing active offer, allow submitting
      return !this.offerId || this.currentOffer.status === "active";
    }
  }
});
