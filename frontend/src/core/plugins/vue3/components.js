// Vue 3 replacements for the Vue 2 plugins registered in ../*.js (those files stay, unused).
// Third-party Vue 3 components run with compatConfig MODE 3: compat MODE 2 is only for the legacy code.
import PortalVue from "portal-vue";
import VueApexCharts from "vue3-apexcharts";
import InlineSvg from "vue-inline-svg";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import "vue3-perfect-scrollbar/dist/vue3-perfect-scrollbar.css";
import draggable from "vuedraggable";
import { AgGridVue } from "ag-grid-vue3";

/** Marks a Vue 3 library component as native Vue 3 (no Vue 2 compat behaviour). */
export const vue3Native = component => {
  if (component && typeof component === "object") component.compatConfig = { ...(component.compatConfig || {}), MODE: 3 };
  return component;
};

// Imported locally by legacy components: mark the shared module objects once.
vue3Native(draggable);
vue3Native(AgGridVue);

export default {
  install(app) {
    app.use(PortalVue);
    app.component("apexchart", vue3Native(VueApexCharts));
    app.component("inline-svg", vue3Native(InlineSvg));
    app.component("perfect-scrollbar", vue3Native(PerfectScrollbar));
    app.component("PerfectScrollbar", vue3Native(PerfectScrollbar));
  }
};
