/* eslint-disable */
// Vue 3.5 + @vue/compat bootstrap (docs/PLAN.md P9.3). Plugins are registered from src/core/plugins/vue3/.
import { createApp, configureCompat } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "@/core/services/store";
import ApiService from "@/core/services/api.service";
import { VERIFY_AUTH } from "@/core/services/store/auth.module";
import { RESET_LAYOUT_CONFIG } from "@/core/services/store/config.module";
import { createPinia } from "pinia";

// Global 3rd party plugins
import "popper.js";
import "tooltip.js";
import PerfectScrollbar from "perfect-scrollbar";
window.PerfectScrollbar = PerfectScrollbar;
import ClipboardJS from "clipboard";
window.ClipboardJS = ClipboardJS;

// Vue plugins (Vue 3 versions)
import i18n from "@/core/plugins/vue3/i18n";
import BootstrapVuePlugin from "@/core/plugins/vue3/bootstrap-vue";
import ComponentsPlugin from "@/core/plugins/vue3/components";
import MetaTitlePlugin from "@/core/plugins/vue3/meta-title";
import "@/core/plugins/vue3/metronic";
import "@mdi/font/css/materialdesignicons.css";

// Timezone (legacy behaviour kept: new Shift Network code does not use moment)
import moment from "moment-timezone";
moment.tz.setDefault("Europe/London"); //force all submit time using moment in GMT +0

// Vue 2 behaviours the legacy screens and bootstrap-vue still rely on
configureCompat({ MODE: 2, ATTR_FALSE_VALUE: "suppress-warning", COMPONENT_V_MODEL: "suppress-warning" });

// API service init
ApiService.init();

router.beforeEach((to, from, next) => {
  // Shift Network routes have their own session guard (src/sn-routes.js) and must not run the legacy VERIFY_AUTH.
  if (to.path.startsWith("/sn")) return next();
  // Ensure we checked auth before each page load.
  // vue-router 4: next() must be called without arguments (an array would be treated as a redirect).
  Promise.all([store.dispatch(VERIFY_AUTH)]).then(() => next());

  // reset config to initial state
  store.dispatch(RESET_LAYOUT_CONFIG);

  // Scroll page to top on every route change
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 100);
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(store);
app.use(i18n);
app.use(BootstrapVuePlugin);
app.use(ComponentsPlugin);
app.use(MetaTitlePlugin);
app.mount("#app");
