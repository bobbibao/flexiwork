import { defineComponent, PropType } from "vue";
import currency from "currency.js";
import i18nService from "@/core/services/i18n.service.js";
import { ProjectProduct } from "@/common/models";
import { ProjectService } from "../../services";
import { DatePeriod, INVOICE_RATES, InvoiceType } from "../../constants";

const service = new ProjectService();

const component = defineComponent({
  name: "InvConfirmModal",
  props: {
    dialog: {
      type: Boolean,
      required: true
    },
    projectProducts: {
      type: Array as PropType<ProjectProduct[]>,
      default: () => [],
      required: true
    },
    projectId: {
      type: Number,
      default: 0
    },
    currentProject: {
      type: Object as PropType<any>,
      default: () => ({})
    },
    detailCost: {
      type: Object as PropType<any>,
      default: () => ({})
    },
    remainingNet: {
      type: Number,
      default: 0
    },
    additionalTotal: {
      type: Number,
      default: 0
    },
    additionalPercent: {
      type: Number,
      default: 0
    },
    discountPercent: {
      type: Number,
      default: 0
    }
  },
  data() {
    const projectData: ProjectData = {
      currency: this.currentProject.currency_val || this.currentProject.currency || "",
      is_connected: this.currentProject.is_connected || false,
      invoices: this.currentProject.invoices || []
    };

    const detailCostValue: DetailCost = {
      total_net: this.detailCost.total_net || 0,
      total_discount: this.detailCost.total_discount || 0
    };

    return {
      InvoiceType,
      DatePeriod,
      invoiceType: InvoiceType.PERCENT,
      projectData,

      detailCostValue,

      remainingNetValue: this.remainingNet,
      discountPercentValue: this.discountPercent,
      additionalPercentValue: this.additionalPercent,
      additionalTotalValue: this.additionalTotal,

      percentAmount: "0.00",
      percentValue: "100",

      hourPeriod: "" as DatePeriod | "",
      startDate: "",
      endDate: "",
      totalHours: "0.0",
      hourCost: 0.0,
      lastMonthEffort: false,
      thisMonthEffort: false,
      allEffort: false,

      isFinalInvoice: false,

      services: [] as any[],
      invoiceRates: [...INVOICE_RATES],

      connections: [] as any[],
      connectedEffort: 0.0,
      connectedEffortRows: [] as EffortRow[],
      connectedCompanyEffort: [] as any[],

      connectionShares: [] as any[],
      connectionSelected: {} as Record<string, boolean>,

      totalAmount: 0.0,
      invoicedAmount: 0.0,
      remainingAmount: 0.0,
      discount: 0,
      nkAmount: 0.0,
      nkPercentage: 0,

      loadingCreateInv: false,

      locale: "en-US",
      minDate: "1970-01-01"
    };
  },
  watch: {
    currentProject: {
      immediate: true,
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.projectData.currency = newVal.currency_val || newVal.currency || "";
          this.projectData.is_connected = newVal.is_connected || false;
          this.projectData.invoices = newVal.invoices || [];

          // Direct enum fallback
          this.invoiceType = newVal.invoice_type || InvoiceType.PERCENT;
        }
      },
      deep: true
    },
    detailCost: {
      immediate: true,
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.detailCostValue = {
            total_net: newVal.total_net || 0,
            total_discount: newVal.total_discount || 0
          };

          // Call initInvoiceData AFTER updating detailCostValue
          this.initInvoiceData();
        }
      },
      deep: true
    },
    remainingNet: {
      immediate: true,
      handler(newVal) {
        this.remainingNetValue = newVal;
      }
    },
    additionalTotal: {
      immediate: true,
      handler(newVal) {
        this.additionalTotalValue = newVal;
      }
    },
    additionalPercent: {
      immediate: true,
      handler(newVal) {
        this.additionalPercentValue = newVal;
        this.nkPercentage = newVal;
      }
    },
    discountPercent: {
      immediate: true,
      handler(newVal) {
        this.discountPercentValue = newVal;
      }
    },
    invoiceType() {
      this.isFinalInvoice = false;
      this.updateCalculations();
    },
    percentAmount() {
      if (this.invoiceType === InvoiceType.PERCENT) {
        const newPercentAmt: string = !Number.isNaN(parseFloat(this.percentAmount)) ? this.percentAmount : "0.00";
        this.setInvoiceByAmount(newPercentAmt, false);
      }
    },
    percentValue() {
      if (this.invoiceType === InvoiceType.PERCENT) {
        const newPercentVal: string = !Number.isNaN(parseFloat(this.percentValue)) ? this.percentValue : "100";
        this.setInvoiceByPercent(newPercentVal, false);
      }
    },
    async startDate() {
      if (this.invoiceType === InvoiceType.HOUR) {
        await this.setInvoiceByHour();
      }
    },
    async endDate() {
      if (this.invoiceType === InvoiceType.HOUR) {
        await this.setInvoiceByHour();
      }
    }
  },
  async mounted() {
    // this.initInvoiceData();
    await this.fetchProjectServices();
    await this.fetchProjectConnectionShares();
  },
  methods: {
    cancel() {
      this.$emit("cancel");
    },
    async confirm() {
      if (this.loadingCreateInv) return;
      this.loadingCreateInv = true;

      try {
        let invoiceData: Record<string, any> = {
          type: this.invoiceType,
          is_final: this.isFinalInvoice
        };

        if (this.invoiceType === InvoiceType.PERCENT) {
          invoiceData = {
            ...invoiceData,
            amount: this.percentAmount,
            percent: this.percentValue,
            total: this.projectData.invoices?.length > 0 ? this.remainingNetValue : this.detailCostValue.total_net,
            remaining: this.remainingAmount,
            additional_cost: this.nkAmount,
            additional_percent: this.checkApplyAdditional() ? this.nkPercentage : 0
          };
        } else if (this.invoiceType === InvoiceType.SERVICE) {
          const selectedServices = this.services
            .filter(s => s.checked)
            .map(service => {
              const quoteItem = this.projectProducts.find(item => item.id === service.id);
              return {
                ...quoteItem,
                ...service,
                invoice_rate: service.rate
              };
            });

          invoiceData = {
            ...invoiceData,
            service: selectedServices,
            total: this.projectData.invoices?.length > 0 ? this.remainingNetValue : this.detailCostValue.total_net,
            remaining: this.remainingAmount,
            additional_cost: this.nkAmount,
            additional_percent: this.checkApplyAdditional() ? this.nkPercentage : 0
          };
        } else if (this.invoiceType === InvoiceType.HOUR) {
          const arr = [...this.connectedEffortRows, ...this.connectedCompanyEffort];

          invoiceData = {
            ...invoiceData,
            totalHours: this.connectedEffort,
            rows: arr,
            additional_cost: this.nkAmount,
            additional_percent: this.checkApplyAdditional() ? this.nkPercentage : 0,
            start_date: this.startDate,
            end_date: this.endDate,
            hourCost: this.hourCost
          };
        }

        this.$emit("invoice-confirmed", invoiceData);
        this.$emit("update:dialog", false);
      } catch (error) {
        console.error(error);
      } finally {
        this.loadingCreateInv = false;
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
    onPercentAmountBlur() {
      if (this.invoiceType === InvoiceType.PERCENT) {
        const newPercentAmt: string = !Number.isNaN(parseFloat(this.percentAmount)) ? this.percentAmount : "0.00";
        this.setInvoiceByAmount(newPercentAmt, true);

        if (typeof this.remainingAmount === "number") {
          this.remainingAmount = parseFloat(this.remainingAmount.toFixed(2));
        }
      }
    },

    onPercentValueBlur() {
      if (this.invoiceType === InvoiceType.PERCENT) {
        const newPercentVal: string = !Number.isNaN(parseFloat(this.percentValue)) ? this.percentValue : "100";
        this.setInvoiceByPercent(newPercentVal, true);

        if (typeof this.remainingAmount === "number") {
          this.remainingAmount = parseFloat(this.remainingAmount.toFixed(2));
        }
      }
    },

    updateCalculations(): void {
      if (this.invoiceType === InvoiceType.PERCENT) {
        this.setInvoiceByAmount(this.percentAmount, true);
        if (typeof this.remainingAmount === "number") {
          this.remainingAmount = parseFloat(this.remainingAmount.toFixed(2));
        }
      } else if (this.invoiceType === InvoiceType.SERVICE) {
        this.setInvoiceByService();
      } else if (this.invoiceType === InvoiceType.HOUR) {
        this.setInvoiceByHour();
      }
    },

    setInvoiceByAmount(amount: string, shouldFormat: boolean = true): void {
      if (Number(amount)) {
        let val = 0.0;
        let nk = 0.0;
        if (this.projectData.invoices?.length > 0) {
          if (this.checkApplyAdditional()) {
            let ratio = this.calculatePartialRemainingRatio();
            val = parseFloat((this.detailCostValue.total_net * ratio).toString()) - parseFloat(amount);
            if (shouldFormat) {
              this.percentValue = this.formatNumberWithoutTrailingZeros(
                (parseFloat(amount) / parseFloat((this.detailCostValue.total_net * ratio).toString())) * 100
              );
            }
            nk = parseFloat(amount);
          } else {
            val = parseFloat(this.remainingNetValue.toString()) - parseFloat(amount);
            if (shouldFormat) {
              this.percentValue = this.formatNumberWithoutTrailingZeros(
                (parseFloat(amount) / parseFloat(this.remainingNetValue.toString())) * 100
              );
            }
            nk = 0;
          }
        } else {
          val = parseFloat(this.detailCostValue.total_net.toString()) - parseFloat(amount);
          if (shouldFormat) {
            this.percentValue = this.formatNumberWithoutTrailingZeros(
              (parseFloat(amount) / parseFloat(this.detailCostValue.total_net.toString())) * 100
            );
          }
          if (this.checkApplyAdditional()) {
            nk =
              (parseFloat((this.detailCostValue.total_net + this.detailCostValue.total_discount).toString()) *
                parseFloat(this.percentValue)) /
              100;
          } else {
            nk = 0;
          }
        }
        // Always set the remaining amount regardless of formatting flag
        this.remainingAmount = val;
        this.nkAmount = nk * (parseFloat(this.nkPercentage.toString()) / 100);

        // Format the amount input value on blur
        if (shouldFormat) {
          this.percentAmount = parseFloat(amount).toFixed(2);
        }
      } else {
        this.remainingAmount = 0;
        if (shouldFormat) {
          this.percentValue = "0";
          this.percentAmount = "0.00";
        }
        this.nkAmount = 0;
      }
    },
    formatNumberWithoutTrailingZeros(num: number): string {
      const formatted = num.toFixed(2);
      if (formatted.endsWith(".00")) {
        return formatted.slice(0, -3);
      } else if (formatted.endsWith("0")) {
        return formatted.slice(0, -1);
      }
      return formatted;
    },

    setInvoiceByPercent(percent: string, shouldFormat: boolean = true): void {
      if (Number(percent)) {
        let val = 0.0;
        let nk = 0.0;
        if (this.projectData.invoices?.length > 0) {
          if (this.checkApplyAdditional()) {
            let ratio = this.calculatePartialRemainingRatio();
            let total = this.detailCostValue.total_net * ratio;
            val = (parseFloat(total.toString()) * parseFloat(percent)) / 100;
            nk = val;
            // Always explicitly set the remaining amount
            this.remainingAmount = parseFloat(total.toString()) - val;
          } else {
            val = (parseFloat(this.remainingNetValue.toString()) * parseFloat(percent)) / 100;
            nk = 0;
            // Always explicitly set the remaining amount
            this.remainingAmount = parseFloat(this.remainingNetValue.toString()) - val;
          }
        } else {
          val = (parseFloat(this.detailCostValue.total_net.toString()) * parseFloat(percent)) / 100;
          // Always explicitly set the remaining amount
          this.remainingAmount = parseFloat(this.detailCostValue.total_net.toString()) - val;
          if (this.checkApplyAdditional()) {
            nk =
              (parseFloat((this.detailCostValue.total_net + this.detailCostValue.total_discount).toString()) *
                parseFloat(percent)) /
              100;
          } else {
            nk = 0;
          }
        }
        if (shouldFormat) {
          this.percentAmount = parseFloat(val.toString()).toFixed(2);
        }
        this.nkAmount = parseFloat(nk.toString()) * (parseFloat(this.nkPercentage.toString()) / 100);
      } else {
        // Always explicitly set the remaining amount
        this.remainingAmount = 0;
        if (shouldFormat) {
          this.percentAmount = "0.00";
        }
        this.nkAmount = 0;
      }
    },
    setInvoiceByService(): void {
      let val = 0.0;
      let cost = 0.0;
      for (const selected of this.services) {
        if (selected.checked) {
          cost +=
            (parseFloat(selected.cost.toString()) -
              parseFloat(selected.cost.toString()) * (this.discountPercentValue / 100)) *
            selected.rate;
        }
      }
      this.invoicedAmount = cost;

      if (this.checkApplyAdditional()) {
        this.nkAmount = cost * (this.nkPercentage / 100);
      } else {
        this.nkAmount = 0;
      }

      if (this.projectData.invoices?.length > 0) {
        val = this.remainingNetValue - cost - this.nkAmount;
      } else {
        val = this.detailCostValue.total_net - cost;
      }

      this.remainingAmount = val;
    },
    async setInvoiceByHour(): Promise<void> {
      let val = 0.0;
      let rate = 0.0;
      let connected_rate = 0.0;
      let connected_hours = 0.0;

      this.connectedEffortRows = [];
      this.connectedCompanyEffort = [];

      if (this.startDate && this.endDate && this.startDate <= this.endDate) {
        if (this.projectData.is_connected) {
          try {
            const connectionList = await service.getProjectConnectionList(this.projectId);

            for (const item of connectionList) {
              for (const connection of this.connections) {
                if (item.company_id === connection.id && connection.checked) {
                  const effortData = await service.getProjectEffortByCompany(
                    parseInt(item.id),
                    this.startDate,
                    this.endDate,
                    item.company_id,
                    this.allEffort
                  );

                  connected_hours += parseFloat(effortData.total.toString());

                  this.connectedCompanyEffort = [...this.connectedCompanyEffort, ...effortData.rows].filter(
                    (item, index, self) => index === self.findIndex(t => t.name === item.name)
                  );

                  for (const service of effortData.rows) {
                    connected_rate += service.price * service.spent_in_hour;
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error fetching connected project data:", error);
          }
        }

        try {
          const effortData = await service.getProjectEffort(
            this.projectId,
            this.startDate,
            this.endDate,
            this.allEffort
          );

          this.connectedEffortRows = effortData.rows;

          for (const service of effortData.rows) {
            rate += service.price * service.spent_in_hour;
          }

          rate += connected_rate;

          if (this.projectData.invoices?.length > 0) {
            if (this.checkApplyAdditional()) {
              let ratio = this.calculatePartialRemainingRatio();
              val = this.detailCostValue.total_net * ratio - rate;
              this.nkAmount = rate * (this.nkPercentage / 100);
            } else {
              val = this.remainingNetValue - rate;
              this.nkAmount = 0;
            }
          } else {
            val = this.detailCostValue.total_net - rate;
            if (this.checkApplyAdditional()) {
              this.nkAmount = rate * (this.nkPercentage / 100);
            } else {
              this.nkAmount = 0;
            }
          }

          this.hourCost = rate;
          this.connectedEffort = connected_hours + effortData.total;
          this.totalHours = this.connectedEffort.toFixed(2);
          this.remainingAmount = val;
        } catch (error) {
          console.error("Error calculating invoice by hour:", error);
        }
      }
    },
    async setInvoiceDate(type: DatePeriod) {
      const now = new Date();

      switch (type) {
        case DatePeriod.FROM_BEGINNING:
          this.allEffort = !this.allEffort;
          this.thisMonthEffort = false;
          this.lastMonthEffort = false;

          if (this.allEffort) {
            const invoiceDate = await this.fetchProjectBegin();
            this.startDate = this.formatDateToYMD(invoiceDate);
            this.endDate = this.formatDateToYMD(now);
          }
          break;

        case DatePeriod.THIS_MONTH:
          this.thisMonthEffort = !this.thisMonthEffort;
          this.lastMonthEffort = false;
          this.allEffort = false;

          if (this.thisMonthEffort) {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            this.startDate = this.formatDateToYMD(firstDayOfMonth);
            this.endDate = this.formatDateToYMD(lastDayOfMonth);
          }
          break;

        case DatePeriod.LAST_MONTH:
          this.lastMonthEffort = !this.lastMonthEffort;
          this.thisMonthEffort = false;
          this.allEffort = false;

          if (this.lastMonthEffort) {
            const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            this.startDate = this.formatDateToYMD(firstDayLastMonth);
            this.endDate = this.formatDateToYMD(lastDayLastMonth);
          }
          break;
      }

      if (this.invoiceType === InvoiceType.HOUR) {
        await this.fetchProjectEffortByCompany();
        await this.setInvoiceByHour();
      }
    },
    formatDateToYMD(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    initDateRange(): void {
      // Initialize date range is from start date to end date of current month
      const now = new Date(),
        initStartDate = new Date(now.getFullYear(), now.getMonth(), 1),
        initEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      this.minDate = "1970-01-01";

      this.startDate = this.formatDateToYMD(initStartDate);
      this.endDate = this.formatDateToYMD(initEndDate);
    },
    async setFinalInvoice(): Promise<void> {
      if (this.isFinalInvoice) {
        if (this.invoiceType === InvoiceType.PERCENT) {
          if (this.projectData.invoices?.length > 0) {
            if (this.checkApplyAdditional()) {
              let ratio = this.calculatePartialRemainingRatio();
              this.percentAmount = parseFloat((this.detailCostValue.total_net * ratio).toString()).toFixed(2);
              this.nkAmount = this.additionalTotalValue * ratio;
            } else {
              this.percentAmount = parseFloat(this.remainingNetValue.toString()).toFixed(2);
              this.nkAmount = 0;
            }
            this.percentValue = "100";
          } else {
            this.percentAmount = parseFloat(this.detailCostValue.total_net.toString()).toFixed(2);
            this.percentValue = "100";
            this.nkAmount =
              parseFloat((this.detailCostValue.total_net + this.detailCostValue.total_discount).toString()) *
              (this.nkPercentage / 100);
          }
          this.remainingAmount = 0;
        } else if (this.invoiceType === InvoiceType.SERVICE) {
          this.services.forEach(service => {
            service.checked = true;
          });
          this.setInvoiceByService();
        } else if (this.invoiceType === InvoiceType.HOUR) {
          await this.setInvoiceByHour();
        }
      }
    },

    checkApplyAdditional(): boolean {
      return this.nkPercentage > 0;
    },
    calculatePartialRemainingRatio(): number {
      let ratio = this.remainingNetValue / (this.detailCostValue.total_net + this.additionalTotalValue);
      return ratio;
    },
    initInvoiceData() {
      if (this.projectData.invoices?.length > 0) {
        if (this.checkApplyAdditional()) {
          let ratio = this.calculatePartialRemainingRatio();
          this.percentAmount = parseFloat((this.detailCostValue.total_net * ratio).toString()).toFixed(2);
          this.nkAmount = this.additionalTotalValue * ratio;
        } else {
          this.percentAmount = parseFloat(this.remainingNetValue.toString()).toFixed(2);
          this.nkAmount = 0;
        }
      } else {
        this.percentAmount = parseFloat(this.detailCostValue.total_net.toString()).toFixed(2);
        if (this.checkApplyAdditional()) {
          this.nkAmount = parseFloat(this.detailCostValue.total_net.toString()) * (this.nkPercentage / 100);
        } else {
          this.nkAmount = 0;
        }
      }

      this.remainingAmount = 0;
      this.isFinalInvoice = false;
      this.allEffort = false;
      this.initDateRange();

      this.updateCalculations();
    },
    toggleServiceSelection(index: number): void {
      if (this.services[index]) {
        this.services[index].checked = !this.services[index].checked;
      }
    },
    async fetchProjectServices() {
      try {
        const projectServices = await service.getProjectServices(this.projectId).then(rows => {
          return rows.map((row: any) => ({
            ...row,
            charged: Math.round(((row.cost - row.remaining) / row.cost) * 100),
            rate: 1,
            checked: false
          }));
        });
        this.services = projectServices;
      } catch (error) {
        console.error("Error fetching project services:", error);
      }
    },
    async fetchProjectBegin(): Promise<Date> {
      try {
        const projectBegin = await service.getProjectBegin(this.projectId);
        return new Date(projectBegin.start_date);
      } catch (error) {
        console.error("Error fetching project begin:", error);
        throw error;
      }
    },
    async fetchProjectConnectionShares() {
      try {
        const shares = await service.getProjectConnectionShares(this.projectId);
        this.connectionShares = shares;

        const connectionsFromShares = this.connectionShares.map(share => ({
          id: share.id,
          name: share.name,
          company_id: share.id,
          checked: true
        }));

        this.connections = connectionsFromShares;
      } catch (error) {
        console.error("Error fetching project connection shares:", error);
      }
    },
    toggleConnectionSelection(index: number): void {
      if (this.connections[index]) {
        this.connections[index].checked = !this.connections[index].checked;

        if (this.invoiceType === InvoiceType.HOUR) {
          this.setInvoiceByHour();
        }
      }
    },
    async fetchProjectEffortByCompany() {
      try {
        const selectedConnection: number[] = this.connections
          .filter(connection => connection.checked)
          .map(connection => connection.company_id);
        const connectedEffortData = await Promise.all(
          selectedConnection.map((companyId: number) =>
            service.getProjectEffortByCompany(this.projectId, this.startDate, this.endDate, companyId, this.allEffort)
          )
        );
        this.connectedCompanyEffort = connectedEffortData.reduce((acc: any[], data: any[]) => {
          acc.push(...data);
          return acc;
        }, []);
      } catch (error) {
        console.error("fetchProjectEffortByCompany:", error);
      }
    }
  }
});

export default {
  ...component,
  i18nService
};
