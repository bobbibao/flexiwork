// BootstrapVue 2.23 under @vue/compat (docs/ARCHITECTURE.md §17.2).
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

export default {
  install(app) {
    app.use(BootstrapVue);
    app.use(IconsPlugin);
  }
};
