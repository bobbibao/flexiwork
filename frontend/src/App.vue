<template>
  <router-view></router-view>
</template>

<style lang="scss">
// 3rd party plugins css
@import "~bootstrap-vue/dist/bootstrap-vue.css";
@import "~perfect-scrollbar/css/perfect-scrollbar.css";
@import "~socicon/css/socicon.css";
@import "~@fortawesome/fontawesome-free/css/all.css";
@import "~line-awesome/dist/line-awesome/css/line-awesome.css";
@import "assets/plugins/flaticon/flaticon.css";
@import "assets/plugins/flaticon2/flaticon.css";
@import "assets/plugins/keenthemes-icons/font/ki.css";

// Main demo style scss
@import "assets/sass/style.vue";

// Check documentation for RTL css
// Update HTML with RTL attribute at public/index.html
/*@import "assets/css/style.vue.rtl";*/
</style>

<script>
import { OVERRIDE_LAYOUT_CONFIG } from "@/core/services/store/config.module";
import ApiService from "./core/services/api.service";
import JwtService from "./core/services/jwt.service";

export default {
  name: "Flexiwork",
  data() {
    return {
      toastShown: false, // Flag to prevent showing the toast again
      MISSING_TIMESHEET_ID: "missing-timesheet-toast", // Unique ID for the toast
    };
  },
  async mounted() {
    /**
     * this is to override the layout config using saved data from localStorage
     * remove this to use config only from static json (@/core/config/layout.config.json)
     */
    this.$store.dispatch(OVERRIDE_LAYOUT_CONFIG);
    await this.checkAndShowToast();
  },
  watch: {
    $route() {
      this.checkAndShowToast();
      this.$root.$on('bv::toast::hidden', (event) => {
        if (event.componentId === this.MISSING_TIMESHEET_ID) {
          this.toastShown = false; // Reset the flag when the toast is hidden
        }
      })
    },
  },
  methods: {
    async checkAndShowToast() {
      // Check if the route is excluded from the toast notification
      const excludedRoutesRegex = /^(\/(login|register|forgot-password|reset-password|verify-register(\/[\w-]+)?))|^\/report\/.+$|^\/sn(\/|$)/; // Shift Network pages use their own session
      // Without a legacy session the call can only fail with 401 (e.g. Shift Network pages, first load).
      if (!JwtService.getToken() || this.$route.path.match(excludedRoutesRegex) || this.toastShown) {
        return;
      }
      // Handle the toast notification logic
      await ApiService.get("verify").then(({ data }) => {
        if (data.payload && data.payload.missing_timesheet_data) {
          this.$bvToast.toast(`${this.$t("msg.missingTimesheet")}`, {
            title: this.$t("title.missingTimesheet"),
            variant: "warning",
            solid: true,
            noAutoHide: true,
            toaster: "b-toaster-top-center",
            href: "/#/timesheet",
            appendToast: true, // Make sure that the toast is not overridden by other toasts
            id: this.MISSING_TIMESHEET_ID,
          });
          this.toastShown = true;
        }
      });
    },
  },
};
</script>
