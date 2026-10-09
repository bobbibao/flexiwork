<template>
  <!-- begin:: Header -->
  <div
    id="kt_header"
    ref="kt_header"
    class="header"
    v-bind:class="headerClasses"
  >
    <div
      class="container-fluid d-flex align-items-center justify-content-between"
    >
      <!-- begin:: Header Menu -->
      <div
        class="header-menu-wrapper header-menu-wrapper-left"
        ref="kt_header_menu_wrapper"
      >
        <div>
          <h2>{{ currentCompany.name }}</h2>
          <span>Serverzeit: {{ currentTime }}</span>
        </div>

        <div
          v-if="headerMenuEnabled"
          id="kt_header_menu"
          ref="kt_header_menu"
          class="header-menu header-menu-mobile"
          v-bind:class="headerMenuClasses"
        >
          <KTMenu></KTMenu>
          <KTTopbar></KTTopbar>
        </div>
      </div>
      <!-- end:: Header Menu -->
    </div>
  </div>
  <!-- end:: Header -->
</template>

<script>
import { mapGetters } from "vuex";
import moment from "moment";
import KTMenu from "@/view/layout/header/Menu.vue";
import KTTopbar from "@/view/layout/header/Topbar.vue";
import KTLayoutHeader from "@/assets/js/layout/base/header.js";
import KTLayoutHeaderMenu from "@/assets/js/layout/base/header-menu.js";

export default {
  name: "KTHeader",
  components: {
    KTMenu,
    KTTopbar
  },
  mounted() {
    // Init Desktop & Mobile Headers
    KTLayoutHeader.init("kt_header", "kt_header_mobile");

    // Init Header Menu
    KTLayoutHeaderMenu.init(
      this.$refs["kt_header_menu"],
      this.$refs["kt_header_menu_wrapper"]
    );
  },
  computed: {
    ...mapGetters(["layoutConfig", "getClasses", "currentCompany"]),

    /**
     * Check if the header menu is enabled
     * @returns {boolean}
     */
    headerMenuEnabled() {
      return !!this.layoutConfig("header.menu.self.display");
    },

    /**
     * Get extra classes for header based on the options
     * @returns {null|*}
     */
    headerClasses() {
      const classes = this.getClasses("header");
      if (typeof classes !== "undefined") {
        return classes.join(" ");
      }
      return null;
    },

    /**
     * Get extra classes for header menu based on the options
     * @returns {null|*}
     */
    headerMenuClasses() {
      const classes = this.getClasses("header_menu");
      if (typeof classes !== "undefined") {
        return classes.join(" ");
      }
      return null;
    },

    currentTime() {
      return moment().format("MMMM Do YYYY, h:mm:ss a");
    }
  }
};
</script>
