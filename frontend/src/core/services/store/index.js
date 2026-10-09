import Vue from "vue";
import Vuex from "vuex";

import auth from "./auth.module";
import htmlClass from "./htmlclass.module";
import config from "./config.module";
import breadcrumbs from "./breadcrumbs.module";
import product from "./product";
import customer from "./customer";
import settings from "./settings";
import offer from "./offer";
import project from "./project";
import invoice from "./invoice";
import expense from "./expense";
import dashboard from "./dashboard";
import timesheet from "./timesheet";
import report from "./report";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    auth,
    htmlClass,
    config,
    breadcrumbs,
    product,
    customer,
    settings,
    offer,
    project,
    invoice,
    expense,
    dashboard,
    timesheet,
    report
  }
});
