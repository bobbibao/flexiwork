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
  EditableTitle,
  AdditionalCosts,
  CustomerSelector,
  Accordion,
  ChevronLeft
} from "@/components";
import { ProjectProduct, OfferSetting, Customer } from "@/common/models";
import { Vat } from "@/components/organisms/QuoteItems/type";
import { Response } from "@/common/dtos";

import ApiService from "@/api/api.service";
import i18nService from "@/core/services/i18n.service.js";

import { CreateProjectDto, IProject } from "../../dtos";
import { ProjectService } from "../../services";
import { InvConfirmModal } from "../../components";
import { InvoiceType } from "../../constants";

import moment from "moment";
import currency from "currency.js";

const service = new ProjectService();

const component = defineComponent({
  name: "ProjectDetail",
  props: {},
  components: {
    ButtonCustom,
    ChevronLeft,
    Trash2,
    Eye,
    Accordion,
    ContentEditor,
    SearchableDropdown,
    QuoteItems,
    CustomerSelector,
    InternalDesc,
    AdditionalCosts,
    ConfirmModal,
    EditableTitle,
    InvConfirmModal
  },
  metaInfo: {
    title: "Project Detail"
  },
  mixins: [Toast],
  setup() {
    const currentVatRates = ref<Vat[]>([]);
    return { currentVatRates };
  },
  data() {
    const subtitleOptions: { label: string }[] = [];
    const defaultKmOptions: SelectOption[] = [];
    const defaultAdditionalOptions: Array<{ label: string; is_active: boolean; value: string }> = [];
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

    const originalProject: Ref<IProject | undefined> = ref<IProject | undefined>(undefined);
    const currentProject: {
      name: string;
      status: string;
      customer: Customer | null;
      location: string;
      date: string;
      date_formatted: string;
      subtitle: string;
      begin_desc: string;
      begin_break: boolean;
      end_desc: string;
      internal_desc: Array<{ label: string; is_active: boolean }>;
      internal_desc_custom: string;
      quote_items: ProjectProduct[];
      currency_val: string;
      begin: string;
      end: string;
      discount_percent: number;
      is_internal: boolean;
      is_connected: boolean;
      only_my_company: boolean;
      rate_per_hour: number;
      address: string;
      number: string;
      assignee: { id: number; [key: string]: any } | null;
      assignee_id: number | null;
      end_on: string;
      end_on_formatted: string;
      invoices: Array<{ id: number; [key: string]: any }>;
      additional_percent: number;
      invoice_type: InvoiceType;
    } = {
      name: "",
      status: "",
      customer: null as Customer | null,
      location: "",
      date: new Date().toISOString(),
      date_formatted: "",
      subtitle: "",
      begin_desc: "",
      begin_break: false,
      end_desc: "",
      internal_desc: defaultInternalDesc,
      internal_desc_custom: "",
      quote_items: [],
      currency_val: "",
      begin: "", // section 1
      end: "", // section 2
      discount_percent: 0,
      is_internal: false,
      is_connected: false,
      only_my_company: false,
      rate_per_hour: 125.0,
      address: "",
      number: "",
      assignee: null,
      assignee_id: null,
      end_on: "",
      end_on_formatted: "",
      invoices: [], // Assuming this is an array of invoice objects
      additional_percent: 0,
      invoice_type: InvoiceType.PERCENT
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
        }
      },
      locale: "de",
      currentProject,
      originalProject,
      subtitleOptions,
      defaultKmOptions,
      defaultAdditionalOptions,
      defaultInternalDesc,
      customerDialogVisible: false,
      invConfirmModalVisible: false,
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
      acceptDateFormatted: "",
      loadingPreview: false,
      loadingPrint: false,
      loadingDoc: false,
      loadingMail: false,
      loadingCopy: false,
      loadingDelete: false,
      loadingCopyOffer: false,
      currentUsers: [] as Array<{ id: number; [key: string]: any }>,
      settings: null, // Add settings to store fetched data,
      projectInvoiceData: {} as any,
      loadingInvoice: false,
      detailCostData: {} as any,
      remainingNetAmount: 0,
      additionalTotalAmount: 0
    };
  },
  async mounted() {
    this.loading = true;
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }

    this.loading = true;
    try {
      // Fetch critical data in parallel
      const [vatRates, company, users, settings] = await Promise.all([
        this.fetchVatRates(),
        this.fetchCompany(),
        this.fetchUsers(),
        service.getSettings()
      ]);

      // Store settings to avoid redundant calls
      this.settings = settings;

      // Process project data using already fetched settings
      await this.fetchProject(settings);
      await this.fetchDetailCost();

      if (this.originalProject?.currency) {
        this.currentProject.currency_val = this.originalProject.currency;
      } else {
        this.currentProject.currency_val = this.currentCompany.currency;
      }
    } catch (error) {
      console.error("Failed to load project details:", error);
      this.toast("Failed to load project data", "danger");
    } finally {
      this.loading = false;
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
        [customer.company, customer.details.address, customer.details.postcode, customer.details.place]
          .filter(Boolean)
          .some(field => field.toLowerCase().includes(query))
      );
    },
    projectId(): string | null {
      return (this.$route.params.project_id as string) || null;
    }
  },
  watch: {
    "currentProject.name"(newValue: string) {
      this.validateField("name", newValue);
    }
  },
  methods: {
    async handleSubmit() {
      if (this.isSaving) {
        return;
      }

      const fieldsToValidate = [{ field: "name", value: this.currentProject.name, elementId: "projectTitle" }];

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
      const data: CreateProjectDto = this.prepareProjectData();

      try {
        if (this.projectId) {
          await this.updateProject(data);
          this.toast("Project updated successfully", "success");
        } else {
          if (!this.validateForm()) {
            this.isSaving = false;
            return;
          }

          if (!this.currentProject.customer) {
            this.toast(this.$t("msg.noCustomer") as string, "danger");
            this.isSaving = false;
            return;
          }

          await service.createProject(data);
          this.toast("Project created successfully!", "success");
        }

        // Only redirect after successful save
        await this.$nextTick();
        this.$router.push("/project").catch(() => {
          this.isSaving = false;
        });
      } catch (error) {
        this.toast("Failed to save project!", "danger");
        console.error("Failed to save project:", error);
        this.isSaving = false;
      }
    },

    async fetchProject(existingSettings = null) {
      try {
        const projectId = this.projectId;
        // Use existing settings if provided, otherwise fetch new
        const settings = existingSettings || (await service.getSettings());
        const projectSettings = settings.project || {};
        const offerSettings = (settings.offer as OfferSetting) || {};

        if (projectId) {
          const project = (await service.getProject(Number(projectId))) as IProject;
          this.originalProject = project;
          this.populateProjectDetails(project);

          if (
            project.details &&
            "additional_cost" in project.details &&
            Array.isArray(project.details.additional_cost)
          ) {
            this.defaultAdditionalOptions = project.details.additional_cost.map(item => ({
              label: String(item.label),
              is_active: item.is_active,
              value: String(item.value)
            }));
          } else {
            this.defaultAdditionalOptions = (offerSettings.add_cost_setting || []).map(item => ({
              label: String(item.label),
              is_active: false,
              value: String(item.value)
            }));
          }

          this.selected_km_label = project?.details?.selected_km_label as string;
          this.defaultKmOptions = ((offerSettings.km_dropdown_setting as unknown) as SelectOption[]) || [];
          this.subtitleOptions = offerSettings.subtitle_setting || [];

          for (const item of this.currentProject.quote_items) {
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

          this.currentProject.invoices = project.invoices || [];
        } else {
          // Initialize new project with default settings
          this.currentProject.begin_desc = projectSettings.begin_desc || "";
          this.currentProject.end_desc = projectSettings.end_desc || "";
          this.currentProject.address = projectSettings.address || "";

          this.defaultKmOptions = ((offerSettings.km_dropdown_setting as unknown) as SelectOption[]) || [];
          this.defaultAdditionalOptions = offerSettings.add_cost_setting.map(item => ({
            label: String(item.label),
            is_active: false,
            value: String(item.value)
          }));

          this.currentProject.begin = offerSettings?.begin || ""; // section 1

          this.selected_km_label = this.defaultKmOptions[0]?.label as string;
          this.subtitleOptions = projectSettings.subtitle_setting || [];
          this.currentProject.subtitle = this.subtitleOptions[0]?.label || "";

          this.currentProject.assignee_id = this.currentUsers[0]?.id || null;
          this.currentProject.assignee = this.currentUsers[0] || null;
          this.currentProject.end_on_formatted = moment().format("DD.MM.YYYY");
          this.currentProject.end_on = moment().toISOString();
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    },

    async fetchSettings() {
      // If settings were already loaded in mounted, use those
      if (this.settings) return this.settings;

      try {
        const settings = await service.getSettings();
        this.settings = settings;
        return settings;
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        return null;
      }
    },

    async handleGenerateProducts() {},

    async handleDeleteProject() {
      if (!this.projectId) {
        this.toast("No project to delete!", "danger");
        return;
      }

      this.loadingDelete = true;
      try {
        await service.deleteProject(Number(this.projectId));
        this.toast("Project deleted successfully!", "success");
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait for the toast to disappear
        this.$router.push("/project");
      } catch (error) {
        this.toast("Failed to delete project!", "danger");
        console.error("Failed to delete project:", error);
      } finally {
        this.loadingDelete = false;
      }
    },

    async handlePreviewPdf() {
      if (!this.projectId) {
        this.toast("No project to preview!", "danger");
        return;
      }

      this.loadingPreview = true;
      try {
        await service.printProject(Number(this.projectId), "pdf", true);
      } catch (error) {
        this.toast("Failed to generate PDF preview!", "danger");
        console.error("Failed to generate PDF preview:", error);
      } finally {
        this.loadingPreview = false;
      }
    },

    async handleCopyProject() {
      if (!this.projectId) {
        this.toast("No project to copy!", "danger");
        return;
      }

      this.loadingCopy = true;
      try {
        const result = await service.copyProject(Number(this.projectId));
        if (result.success) {
          this.toast("Project copied successfully", "success");
          setTimeout(() => {
            this.goTo(`/project`);
          }, 1000);
        }
      } catch (error) {
        this.toast("Failed to copy project", "danger");
        console.error("Failed to copy project:", error);
      } finally {
        this.loadingCopy = false;
      }
    },

    async handleCopyProjectAsOffer() {
      if (!this.projectId) {
        this.toast("No project to copy as offer!", "danger");
        return;
      }

      this.loadingCopyOffer = true;
      try {
        const result = await service.copyProjectAsOffer(Number(this.projectId));
        if (result.success) {
          this.toast("Project copied as offer successfully", "success");
          setTimeout(() => {
            this.goTo(`/offer`);
          }, 1000);
        }
      } catch (error) {
        this.toast("Failed to copy project as offer", "danger");
        console.error("Failed to copy project as offer:", error);
      } finally {
        this.loadingCopyOffer = false;
      }
    },

    async handleSendMail() {
      if (!this.projectId) {
        this.toast("No project to send!", "danger");
        return;
      }

      this.loadingMail = true;
      try {
        const ID_TOKEN_KEY = "access_token";
        const getToken = localStorage.getItem(ID_TOKEN_KEY);
        const pdfLink = `${process.env.VUE_APP_API_URL}/api/export/preview?id=${this.projectId}&type=project&code=${getToken}`;
        const body =
          this.$t("email.salutation") +
          "\n\n" +
          this.$t("email.projectIntro") +
          " " +
          pdfLink +
          "\n" +
          this.$t("email.projectEnd") +
          "\n\n" +
          this.$t("email.end") +
          "\n" +
          this.currentCompany.name;
        const subject = this.$t("menu.project");
        window.open(
          `mailto:${this.currentProject.customer?.email || ""}:?subject=${subject}&body=${encodeURIComponent(body)}`
        );
      } catch (error) {
        console.error("Failed to send mail:", error);
      } finally {
        this.loadingMail = false;
      }
    },

    async handlePrintPdf() {
      if (!this.projectId) {
        this.toast("No project to print!", "danger");
        return;
      }

      this.loadingPrint = true;
      try {
        await service.printProject(Number(this.projectId));
      } catch (error) {
        console.error("Failed to print project:", error);
      } finally {
        this.loadingPrint = false;
      }
    },

    async handlePrintDocx() {
      if (!this.projectId) {
        this.toast("No project to print as DOCX!", "danger");
        return;
      }

      this.loadingDoc = true;
      try {
        await service.printProject(Number(this.projectId), "docx");
      } catch (error) {
        console.error("Failed to print project docx:", error);
      } finally {
        this.loadingDoc = false;
      }
    },

    openInvoiceConfirmModal() {
      if (!this.projectId) {
        this.toast("No project to create invoice for!", "danger");
        return;
      }

      this.loadingInvoice = true;

      this.fetchAdditionalInfo();
      this.fetchProjectInvoices();
      this.fetchDetailCost();

      this.invConfirmModalVisible = true;
      this.loadingInvoice = false;
    },

    closeInvoiceConfirmModal() {
      this.invConfirmModalVisible = false;
    },

    fetchDetailCost() {
      try {
        // Calculate detail cost using QuoteItems logic
        const quoteItems = this.currentProject.quote_items || [];
        let totalNet = 0;
        let totalDiscount = 0;

        // Simple calculation for total net and discount
        // In a real implementation, this should match the calculation in QuoteItems component
        quoteItems.forEach(item => {
          if (item.type === "individual" && !item.optional) {
            const cost = item.cost || 0;
            const discountValue = cost * (this.currentProject.discount_percent / 100);
            totalNet += cost - discountValue;
            totalDiscount += discountValue;
          }
        });

        this.detailCostData = {
          total_net: totalNet,
          total_discount: totalDiscount
        };

        return this.detailCostData;
      } catch (error) {
        console.error("Error calculating detail cost:", error);
        throw error;
      }
    },

    async fetchProjectInvoices() {
      try {
        if (this.projectId) {
          // Calculate remaining net amount
          const totalInvoiced =
            this.currentProject.invoices?.reduce((total, invoice) => {
              return total + (parseFloat(invoice.amount) || 0);
            }, 0) || 0;

          this.remainingNetAmount = (this.detailCostData.total_net || 0) - totalInvoiced;

          return this.currentProject;
        }
      } catch (error) {
        console.error("Error fetching project invoices:", error);
        throw error;
      }
    },

    fetchAdditionalInfo() {
      try {
        // Calculate additional cost percentage and total
        let additionalPercent = 0;
        let additionalTotal = 0;

        // Find NK (Nebenkosten) item in project's quote items
        const nkItem = this.currentProject.quote_items?.find(
          item => item.is_nk && item.name && item.name.includes("Nebenkosten")
        );

        if (nkItem) {
          // Extract percentage from name (e.g., "Nebenkosten 10%")
          const percentMatch = nkItem.name?.match(/(\d+(?:\.\d+)?)%/);
          if (percentMatch) {
            additionalPercent = parseFloat(percentMatch[0]);
            additionalTotal = (this.detailCostData.total_net * additionalPercent) / 100;
            // Assign to current project
            this.currentProject.additional_percent = additionalPercent;
          }
        }

        this.additionalTotalAmount = additionalTotal;

        return {
          additionalPercent,
          additionalTotal
        };
      } catch (error) {
        console.error("Error calculating additional info:", error);
        throw error;
      }
    },

    async handleCreateInvoice(invoiceData: any) {
      try {
        this.loadingInvoice = true;

        if (!this.projectId) {
          throw new Error("Project ID is required");
        }

        const projectId = parseInt(this.projectId);

        const result = await service.generateInvoice(projectId, invoiceData.type, invoiceData);

        if (result && result.success) {
          this.toast("Invoice created successfully", "success");

          // Navigate to the invoice page
          if (result.invoice_id) {
            setTimeout(() => {
              this.$router.push(`/invoice/${result.invoice_id}`);
            }, 1000);
          } else {
            setTimeout(() => {
              this.$router.push("/invoice");
            }, 1000);
          }
        } else {
          throw new Error("Failed to create invoice");
        }
      } catch (error) {
        console.error("Error creating invoice:", error);
        this.toast("Failed to create invoice", "danger");
      } finally {
        this.loadingInvoice = false;
      }
    },

    populateProjectDetails(project: IProject) {
      const metadata = project.details || {};
      Object.assign(this.currentProject, {
        name: project?.name || "",
        status: project?.status || "",
        quote_items: metadata.quote_items || [],
        customer: project?.customer || null,
        title: metadata.title || "",
        location: metadata.location || "",
        date: metadata.date ? new Date(metadata.date).toISOString() : "",
        date_formatted: metadata.date ? moment(metadata.date).format("DD.MM.YYYY") : "",
        subtitle: metadata.category || "",
        begin_desc: metadata.begin_desc || "",
        begin_break: metadata.begin_break || false,
        end_desc: metadata.end_desc || "",
        internal_desc: metadata.internal_desc || this.defaultInternalDesc,
        internal_desc_custom: metadata.internal_desc_custom || "",
        currency_val: project?.currency || "",
        begin: metadata.begin || "",
        end: metadata.end || "2. Ende des Textes",
        discount_percent: metadata.discount_percent || 0,
        is_internal: project.is_internal || false,
        is_connected: project.is_connected || false,
        only_my_company: metadata.only_my_company || false,
        rate_per_hour: metadata.rate_per_hour || 125.0,
        address: metadata.address || "",
        number: project?.number?.custom_id || project?.number?.id?.toString() || "",
        assignee: project?.assignee || null,
        assignee_id: project?.assignee_id || null,
        end_on: project.end_on ? new Date(project.end_on).toISOString() : "",
        end_on_formatted: project.end_on ? moment(project.end_on).format("DD.MM.YYYY") : "",
        invoice_type: project.invoice_type || InvoiceType.PERCENT
      });
    },

    prepareProjectData(): CreateProjectDto {
      let selected_assignee = null;
      if (this.currentProject.assignee_id) {
        selected_assignee = this.currentUsers.find(user => user.id === this.currentProject.assignee_id) || null;
      }

      return {
        name: this.currentProject.name,
        customer: this.currentProject.customer ?? ({} as Customer),
        location: this.currentProject.location,
        date: this.currentProject.date,
        category: this.currentProject.subtitle,
        begin: this.currentProject.begin,
        end: this.currentProject.end,
        additional_cost: this.defaultAdditionalOptions,
        begin_break: this.currentProject.begin_break ?? false,
        begin_desc: this.currentProject.begin_desc,
        currency: this.currentProject.currency_val,
        discount_percent: this.currentProject.discount_percent,
        end_desc: this.currentProject.end_desc,
        internal_desc: this.currentProject.internal_desc,
        internal_desc_custom: this.currentProject.internal_desc_custom,
        km_dropdown: {
          label: this.selected_km_label,
          value: Number(this.defaultKmOptions.find(option => option.label === this.selected_km_label)?.value) || 0
        },
        quote_items: this.currentProject.quote_items,
        is_internal: this.currentProject.is_internal,
        only_my_company: this.currentProject.only_my_company,
        rate_per_hour: this.currentProject.rate_per_hour,
        address: this.currentProject.address,
        number: this.currentProject.number,
        assignee: selected_assignee,
        end_on: this.currentProject.end_on
      };
    },

    async updateProject(data: CreateProjectDto) {
      try {
        await service.updateProject(Number(this.projectId), data);
      } catch (error) {
        throw new Error(`Failed to update project: ${error}`);
      }
    },

    formatDate() {
      if (this.currentProject.date) {
        this.currentProject.date_formatted = moment(this.currentProject.date).format("DD.MM.YYYY");
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
      if (this.currentProject.date_formatted) {
        const split = this.currentProject.date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.currentProject.date = join;
      }
    },

    formatEndDate() {
      if (this.currentProject.end_on) {
        this.currentProject.end_on_formatted = moment(this.currentProject.end_on).format("DD.MM.YYYY");
      }
    },

    formatEndDateInvert() {
      if (this.currentProject.end_on_formatted) {
        const split = this.currentProject.end_on_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.currentProject.end_on = join;
      }
    },

    goTo(pathName: string) {
      this.$router.push(pathName);
    },

    openCustomerSelector() {
      this.resetCustomerSearch();
      this.fetchCustomers();
      this.customerDialogVisible = true;
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
        this.currentProject.customer = this.selectedCustomer;
        this.customerDialogVisible = false;
      }
    },

    cancelCustomerSelection() {
      this.selectedCustomer = null;
      this.currentProject.customer = null;
      this.customerDialogVisible = false;
    },

    checkArchived() {
      if (this.originalProject?.status === "archive") {
        return true;
      } else {
        return false;
      }
    },

    updateQuoteItems(quoteItems: ProjectProduct[]) {
      this.$set(this.currentProject, "quote_items", quoteItems);
    },

    async fetchCustomers() {
      try {
        this.customers = await service.getCustomers();
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    },

    async fetchUsers() {
      try {
        this.currentUsers = await service.getUsers();
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    },

    async fetchCompany() {
      try {
        const company = await service.getCompany();
        this.currentCompany = company;
      } catch (error) {
        console.error("Failed to fetch company:", error);
      }
    },

    toggleBreak(key: string) {
      const castedKey = key as keyof typeof this.currentProject;
      this.$set(this.currentProject, castedKey, !this.currentProject[castedKey]);
    },

    async fetchVatRates() {
      try {
        const response = await ApiService.get<Response<Vat[]>>("vatrates");
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
      }
    },

    validateForm(): boolean {
      this.validateField("name", this.currentProject.name);

      return this.validation.name.valid;
    },

    formatAcceptDate() {
      if (this.acceptDate) {
        this.acceptDateFormatted = moment(this.acceptDate).format("DD.MM.YYYY");
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
      // If inside create mode (this.projectId is `null`) or editing active project, allow submitting
      return !this.projectId || this.currentProject.status === "active";
    }
  }
});

export default {
  ...component,
  i18nService
};
