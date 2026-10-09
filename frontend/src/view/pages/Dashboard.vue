<template>
  <div>
    <div class="row">
      <div class="col-md-4" v-if="currentUser.role !== 'employee'">
        <MixedWidget1></MixedWidget1>
      </div>
      <div class="col-md-8" v-if="currentUser.role !== 'employee'">
        <Revenue :currency="currency"></Revenue>
      </div>
      <div class="col-md-12" v-if="currentUser.role !== 'employee'">
        <Overview :currency="currency"></Overview>
      </div>
    </div>
  </div>
</template>

<script>
import MixedWidget1 from "@/view/content/widgets/mixed/Widget1.vue";
import Overview from "@/view/content/widgets/mixed/Overview.vue";
import Revenue from "@/view/content/widgets/mixed/Revenue.vue";
import { mapGetters } from "vuex";
import { GET_COMPANY, GET_SETTINGS } from "@/core/services/store/settings";

export default {
  name: "dashboard",
  components: {
    MixedWidget1,
    Overview,
    Revenue
  },
  metaInfo: {
    title: "Dashboard",
    meta: [
      { hid: "description", name: "description", content: "Dashboard Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Dashboard | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Dashboard | Archapp"
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
      currency: ""
    };
  },
  computed: {
    ...mapGetters(["currentCompany", "currentUser", "currentSettings"])
  },
  async mounted() {
    if (this.currentUser.role !== "employee") {
      await this.$store.dispatch(GET_COMPANY);
      await this.$store.dispatch(GET_SETTINGS);
      this.getCurrency();
    }
    if (this.currentUser.role === "employee") {
      this.$router.push("/timesheet");
    } else if (this.currentUser.role === "manager") {
      this.$router.push("/time-overview");
    }
  },
  methods: {
    getCurrency() {
      let result = "";
      if (!this.currentSettings.master_data.allow_to_use_other_currencies) {
        result = this.currentCompany.currency;
      } else {
        result = this.currentSettings.master_data.currencies
          .toString()
          .replaceAll(",", "/");
      }
      this.currency = result;
    }
  }
};
</script>
