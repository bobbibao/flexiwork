import { User } from "@/common/models";
import { Customer } from "@/common/models/customer.model";
import { Toast } from "@/components";
import moment from "moment";
import { defineComponent } from "vue";
import { TimesheetsService } from "../../services";

const timesheetService = new TimesheetsService();

export default defineComponent({
  name: "ReportModal",
  mixins: [Toast],
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    isLockMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      reportMonth: moment().month(),
      reportYear: moment().year(),
      confirm_unlock: false,
      selected_users: 0,
      months: [
        { name: this.$t("months.janFull"), code: 0 },
        { name: this.$t("months.febFull"), code: 1 },
        { name: this.$t("months.marFull"), code: 2 },
        { name: this.$t("months.aprFull"), code: 3 },
        { name: this.$t("months.mayFull"), code: 4 },
        { name: this.$t("months.junFull"), code: 5 },
        { name: this.$t("months.julFull"), code: 6 },
        { name: this.$t("months.augFull"), code: 7 },
        { name: this.$t("months.sepFull"), code: 8 },
        { name: this.$t("months.octFull"), code: 9 },
        { name: this.$t("months.novFull"), code: 10 },
        { name: this.$t("months.decFull"), code: 11 }
      ],
      years: [] as number[],
      unlock_users: [{ value: 0, text: this.$t("timesheet.selectUser") }],
    };
  },
  computed: {
    modalTitle() {
      return this.isLockMode ? this.$t("title.submitReport") : this.$t("title.unlockReport");
    },
    confirmText() {
      return this.$t("timesheet.confirmReport");
    }
  },
  watch: {
    async visible(newVal: boolean) {
      try {
        if (newVal && !this.isLockMode) {
          const dateStr = this.getFirstDayOfMonth();
          const fetchedUsers = await timesheetService.getUnlockUsers(dateStr);
          this.unlock_users = [
            { value: 0, text: this.$t("timesheet.selectUser") },
            ...fetchedUsers.map((user: User) => ({
              value: user.id,
              text: `${user.email}`
            }))
          ];
          this.selected_users = 0;
        }
      } catch (error) {
        console.error("Error fetching unlock users:", error);
        this.toast("Failed to fetch unlock users!", "danger");
      }
    },
    async reportMonth() {
      if (!this.isLockMode) {
        const dateStr = this.getFirstDayOfMonth();
        const fetchedUsers = await timesheetService.getUnlockUsers(dateStr);
        this.unlock_users = [
          { value: 0, text: this.$t("timesheet.selectUser") },
          ...fetchedUsers.map((user: User) => ({
            value: user.id,
            text: `${user.email}`
          }))
        ];
      }
    },
    async reportYear() {
      if (!this.isLockMode) {
        const dateStr = this.getFirstDayOfMonth();
        const fetchedUsers = await timesheetService.getUnlockUsers(dateStr);
        this.unlock_users = [
          { value: 0, text: this.$t("timesheet.selectUser") },
          ...fetchedUsers.map((user: User) => ({
            value: user.id,
            text: `${user.email}`
          }))
        ];
      }
    }
  },
  methods: {
    updateSearchQuery(query: string) {
      this.$emit("update:searchQuery", query);
    },
    selectCustomer(customer: Customer) {
      this.$emit("selectCustomer", customer);
    },
    cancel() {
      this.confirm_unlock = false;
      //reset to default
      this.selected_users = 0;
      this.reportMonth = moment().month();
      this.reportYear = moment().year();
      this.$emit("cancel");
    },

    initDate() {
      const currentYear = moment().year();
      this.years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
      this.reportMonth = moment().month();
      this.reportYear = currentYear;
    },
    setUnlockReportDate() {},
    setUnlockedUser(userId: number) {
      this.selected_users = userId;
    },
    confirm() {
      if (!this.confirm_unlock) {
        this.toast(String(this.$t("timesheet.confirmAlert")), "danger");
        return;
      }

      this.$emit("confirm", this.getFirstDayOfMonth());
    },
    getFirstDayOfMonth() {
      return moment()
        .year(this.reportYear)
        .month(this.reportMonth)
        .startOf("month")
        .format("YYYY-MM-DD");
    }
  },

  async mounted() {
    await this.initDate();
  }
});
