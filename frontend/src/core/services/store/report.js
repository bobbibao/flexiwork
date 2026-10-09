import ApiService from "@/core/services/api.service";
import DataService from "@/core/services/data.service";
import JwtService from "@/core/services/jwt.service";

//action types
export const GET_USER_REPORT = "getUserReport";
export const GET_PROJECT_REPORT = "getProjectReport";
export const GET_OFFER_REPORT = "getOfferReport";
export const GET_INVOICE_REPORT = "getInvoiceReport";
export const GET_ADDRESS_REPORT = "getAddressReport";
export const GET_EFFORT_REPORT = "getEffortReport";
export const GET_FLEXIBLE_REPORT = "getFlexibleReport";
export const GET_PHASE_EFFORT_REPORT = "getPhaseEffortReport";
export const GET_PROJECTS_WITH_LOG = "getProjectsWithLog";
export const GET_PROJECTS_WITH_SUMMARY = "getProjectWithSummary";
export const GET_PROJECTS_WITH_HOUR = "getProjectsWithHour";
export const GET_USER_PROJECT_REPORT = "getUserProjectReport";
export const GET_PROJECT_ALL_INVOICES = "getProjectAllInvoices";
export const EXPORT_USER_REPORT = "exportUserReport";
export const EXPORT_USER_REPORT_EXCEL = "exportUserReportExcel";
export const EXPORT_USER_WITH_RATE_REPORT_EXCEL = "exportUserWithRateReportExcel";
export const EXPORT_OFFER_REPORT_EXCEL = "exportOfferReportExcel";
export const EXPORT_JOB_REPORT = "exportJobReport";
export const EXPORT_PROJECT_REPORT_PDF = "exportProjectReportPdf";
export const EXPORT_OFFER_REPORT_PDF = "exportOfferReportPdf";
export const EXPORT_INVOICE_REPORT_PDF = "exportInvoiceReportPdf";
export const EXPORT_INVOICE_REPORT_EXCEL = "exportInvoiceReportExcel";
export const EXPORT_PROJECT_REPORT_EXCEL = "exportProjectReportExcel";
export const EXPORT_ADDRESS_REPORT_PDF = "exportAddressReportPdf";
export const EXPORT_ADDRESS_REPORT_EXCEL = "exportAddresseportExcel";
export const EXPORT_EFFORT_EXTERNAL_REPORT = "exportEffortExternalReport";
export const EXPORT_EFFORT_INTERNAL_REPORT = "exportEffortInternalReport";
export const EXPORT_EFFORT_EXTERNAL_WITHOUT_RATE_REPORT = "exportEffortExternalWithoutRateReport";
export const EXPORT_EFFORT_INTERNAL_WITHOUT_RATE_REPORT = "exportEffortInternalWithoutRateReport";
export const EXPORT_PROJECT_BY_PHASES = "exportProjectByPhases";
export const EXPORT_PROJECT_BY_TASKS = "exportProjectByTasks";
export const EXPORT_EFFORT_EXTERNAL_EXCEL = "exportEffortExternalExcel";
export const EXPORT_EFFORT_INTERNAL_EXCEL = "exportEffortInternalExcel";
export const EXPORT_EFFORT_EXTERNAL_WITHOUT_RATE_EXCEL = "exportEffortExternalWithoutRateExcel";
export const EXPORT_EFFORT_INTERNAL_WITHOUT_RATE_EXCEL = "exportEffortInternalWithoutRateExcel";
export const EXPORT_FLEXIBLE_REPORT = "exportFlexibleReport";
export const EXPORT_FLEXIBLE_REPORT_EXCEL = "exportFlexibleReportExcel";
export const EXPORT_EFFORT_REPORT = "exportEffortReport";
export const EXPORT_PROJECT_BY_ALL_INVOICES = "exportProjectByAllInvoices";
export const EXPORT_PROJECT_BY_ALL_INVOICES_EXCEL = "exportProjectByAllInvoicesExcel";

//mutation types
export const SET_REPORT_ERROR = "setExpenseError";
export const SET_USER_REPORT = "setUserReport";
export const SET_USER_WITH_RATE_REPORT_EXCEL = "setUserWithRateReportExcel";
export const SET_OFFER_REPORT_EXCEL = "setOfferReportExcel";
export const SET_USER_REPORT_EXCEL = "setUserReportExcel";
export const SET_PROJECT_REPORT = "setProjectReport";
export const SET_OFFER_REPORT = "setOfferReport";
export const SET_INVOICE_REPORT = "setInvoiceReport";
export const SET_ADDRESS_REPORT = "setAddressReport";
export const SET_EFFORT_REPORT = "setEffortRport";
export const SET_FLEXIBLE_REPORT = "setFlexibleReport";
export const SET_PHASE_EFFORT_REPORT = "setPhaseEffortReport";
export const SET_PROJECTS_WITH_LOG = "setProjectsWithLog";
export const SET_PROJECTS_WITH_SUMMARY = "setProjectsWithSummary";
export const SET_PROJECTS_WITH_HOUR = "setProjectsWithHour";
export const SET_USER_PROJECT_REPORT = "setUserProjectReport";
export const SET_PROJECT_ALL_INVOICES = "setProjectAllInvoices";
export const SET_USER_INFO = "setUserInfo";
export const SET_USER_REPORT_PDF = "setUserReportPdf";
export const SET_JOB_REPORT_PDF = "setJobReportPdf";
export const SET_PROJECT_REPORT_PDF = "setProjectReportPdf";
export const SET_OFFER_REPORT_PDF = "setOfferReportPdf";
export const SET_INVOICE_REPORT_PDF = "setInvoiceReportPdf";
export const SET_ADDRESS_REPORT_PDF = "setAddressReportPdf";
export const SET_INVOICE_REPORT_EXCEL = "setInvoiceReportExcel";
export const SET_PROJECT_REPORT_EXCEL = "setProjectReportExcel";
export const SET_ADDRESS_REPORT_EXCEL = "setAddressReportExcel";
export const SET_EFFORT_EXTERNAL_PDF = "setEffortExternalPdf";
export const SET_EFFORT_INTERNAL_PDF = "setEffortInternalPdf";
export const SET_EFFORT_EXTERNAL_WITHOUT_RATE_PDF = "setEffortExternalWithoutRatePdf";
export const SET_EFFORT_INTERNAL_WITHOUT_RATE_PDF = "setEffortInternalWithoutRatePdf";
export const SET_EXPORT_PROJECT_BY_PHASES_PDF = "setExportProjectByPhasesPdf";
export const SET_EXPORT_PROJECT_BY_TASKS_PDF = "setExportProjectByTasksPdf";
export const SET_EFFORT_EXTERNAL_XLSX = "setEffortExternalXlsx";
export const SET_EFFORT_INTERNAL_XLSX = "setEffortInternalXlsx";
export const SET_EFFORT_EXTERNAL_WITHOUT_RATE_XLSX = "setEffortExternalWithoutRateXlsx";
export const SET_EFFORT_INTERNAL_WITHOUT_RATE_XLSX = "setEffortInternalWithoutRateXlsx";
export const SET_FLEXIBLE_PDF = "setFlexiblePdf";
export const SET_EFFORT_REPORT_PDF = "setEffortReportPdf";
export const SET_FLEXIBLE_XLSX = "setFlexibleXlsx";
export const SET_PROJECT_BY_ALL_INVOICES_PDF = "setProjectByAllInvoicesPdf";
export const SET_PROJECT_BY_ALL_INVOICES_XLSX = "setProjectByAllInvoicesXlsx";

const state = {
  error: null,
  user_report: [],
  project_report: [],
  offer_report: [],
  invoice_report: [],
  effort_report: [],
  address_report: [],
  flexible_report: [],
  phase_effort_report: [],
  project_all_invoices: [],
  user_project_report: {},
  user_info: {},
  projects: [],
  projects_summary: [],
  user_pdf_code: "",
  job_pdf_code: "",
  project_pdf_code: "",
  offer_pdf_code: "",
  invoice_pdf_code: "",
  address_pdf_code: "",
  invoice_excel_code: "",
  address_excel_code: "",
  project_excel_code: "",
  effort_external_pdf_code: "",
  effort_internal_pdf_code: "",
  effort_external_without_rate_pdf_code: "",
  effort_internal_without_rate_pdf_code: "",
  effort_external_excel_code: "",
  effort_internal_excel_code: "",
  effort_external_without_rate_excel_code: "",
  effort_internal_without_rate_excel_code: "",
  projects_hour: [],
  holiday_pdf_code: "",
  holiday_excel_code: "",
  project_by_phases_code: "",
  project_by_tasks_code: "",
  project_by_invoices_code: "",
  project_by_invoices_excel_code: "",
  user_effort_code: "",
  download_code: false
};

const getters = {
  currentUserReport(state) {
    return state.user_report;
  },
  currentProjectReport(state) {
    return state.project_report;
  },
  currentOfferReport(state) {
    return state.offer_report;
  },
  currentInvoiceReport(state) {
    return state.invoice_report;
  },
  currentAddressReport(state) {
    return state.address_report;
  },
  currentEffortReport(state) {
    return state.effort_report;
  },
  currentUserProjectReport(state) {
    return state.user_project_report;
  },
  currentFlexibleReport(state) {
    return state.flexible_report;
  },
  currentProjectsWithLog(state) {
    return state.projects;
  },
  currentProjectWithSummary(state) {
    return state.projects_summary;
  },
  currentProjectsWithHour(state) {
    return state.projects_hour;
  },
  currentProjectAllInvoices(state) {
    return state.project_all_invoices;
  }
};

const mutations = {
  [SET_REPORT_ERROR](state, error) {
    state.error = error;
  },
  [SET_USER_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.user_report = data.payload;
    state.error = null;
  },
  [SET_PROJECT_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.project_report = data.payload;
    state.error = null;
  },
  [SET_OFFER_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.offer_report = data.payload;
    state.error = null;
  },
  [SET_ADDRESS_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.address_report = data.payload;
    state.error = null;
  },
  [SET_INVOICE_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.invoice_report = data.payload;
    state.error = null;
  },
  [SET_EFFORT_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.effort_report = data.payload;
    state.error = null;
  },
  [SET_FLEXIBLE_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.flexible_report = [data.payload];
    state.error = null;
  },
  [SET_PHASE_EFFORT_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.phase_effort_report = data.payload;
    state.error = null;
  },
  [SET_PROJECTS_WITH_LOG](state, data) {
    DataService.fillMetadata(data.payload);
    state.projects = data.payload;
    state.error = null;
  },
  [SET_PROJECTS_WITH_SUMMARY](state, data) {
    DataService.fillMetadata(data.payload);
    state.projects_summary = data.payload;
    state.error = null;
  },
  [SET_PROJECTS_WITH_HOUR](state, data) {
    DataService.fillMetadata(data.payload);
    state.projects_hour = data.payload;
    state.error = null;
  },
  [SET_USER_PROJECT_REPORT](state, data) {
    DataService.fillMetadata(data.payload);
    state.user_project_report = data.payload;
    state.error = null;
  },
  [SET_PROJECT_ALL_INVOICES](state, data) {
    DataService.fillMetadata(data.payload.projects);
    state.project_all_invoices = data.payload.projects;
    state.error = null;
  },
  [SET_USER_INFO](state, data) {
    state.user_info = data.payload.user;
    state.error = null;
  },
  [SET_USER_REPORT_PDF](state, data) {
    state.user_pdf_code = data.code;
    state.error = null;
  },
  [SET_USER_REPORT_EXCEL](state, data) {
    state.download_code = data.code;
    state.error = null;
  },
  [SET_USER_WITH_RATE_REPORT_EXCEL](state, data) {
    state.download_code = data.code;
    state.error = null;
  },
  [SET_OFFER_REPORT_EXCEL](state, data) {
    state.download_code = data.code;
    state.error = null;
  },
  [SET_JOB_REPORT_PDF](state, data) {
    state.job_pdf_code = data.code;
    state.error = null;
  },
  [SET_PROJECT_REPORT_PDF](state, data) {
    state.project_pdf_code = data.code;
    state.error = null;
  },
  [SET_OFFER_REPORT_PDF](state, data) {
    state.offer_pdf_code = data.code;
    state.error = null;
  },
  [SET_INVOICE_REPORT_PDF](state, data) {
    state.invoice_pdf_code = data.code;
    state.error = null;
  },
  [SET_ADDRESS_REPORT_PDF](state, data) {
    state.address_pdf_code = data.code;
    state.error = null;
  },
  [SET_PROJECT_REPORT_EXCEL](state, data) {
    state.project_excel_code = data.code;
    state.error = null;
  },
  [SET_INVOICE_REPORT_EXCEL](state, data) {
    state.invoice_excel_code = data.code;
    state.error = null;
  },
  [SET_ADDRESS_REPORT_EXCEL](state, data) {
    state.address_excel_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_EXTERNAL_PDF](state, data) {
    state.effort_external_pdf_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_INTERNAL_PDF](state, data) {
    state.effort_internal_pdf_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_EXTERNAL_WITHOUT_RATE_PDF](state, data) {
    state.effort_external_without_rate_pdf_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_INTERNAL_WITHOUT_RATE_PDF](state, data) {
    state.effort_internal_without_rate_pdf_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_EXTERNAL_XLSX](state, data) {
    state.effort_external_excel_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_INTERNAL_XLSX](state, data) {
    state.effort_internal_excel_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_EXTERNAL_WITHOUT_RATE_XLSX](state, data) {
    state.effort_external_without_rate_excel_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_INTERNAL_WITHOUT_RATE_XLSX](state, data) {
    state.effort_internal_without_rate_excel_code = data.code;
    state.error = null;
  },
  [SET_FLEXIBLE_PDF](state, data) {
    state.holiday_pdf_code = data.code;
    state.error = null;
  },
  [SET_EXPORT_PROJECT_BY_PHASES_PDF](state, data) {
    state.project_by_phases_code = data.code;
    state.error = null;
  },
  [SET_EXPORT_PROJECT_BY_TASKS_PDF](state, data) {
    state.project_by_tasks_code = data.code;
    state.error = null;
  },
  [SET_EFFORT_REPORT_PDF](state, data) {
    state.user_effort_code = data.code;
    state.error = null;
  },
  [SET_FLEXIBLE_XLSX](state, data) {
    state.holiday_excel_code = data.code;
    state.error = null;
  },
  [SET_PROJECT_BY_ALL_INVOICES_PDF](state, data) {
    state.project_by_invoices_code = data.code;
    state.error = null;
  },
  [SET_PROJECT_BY_ALL_INVOICES_XLSX](state, data) {
    state.project_by_invoices_excel_code = data.code;
    state.error = null;
  }
};

const actions = {
  async [GET_PROJECTS_WITH_LOG](context, payload) {
    await ApiService.get(
      `report/projects-with-logs?start=${payload.start}&end=${payload.end}&company_id=${payload.company_id}&status=all`
    )
      .then(({ data }) => {
        context.commit(SET_PROJECTS_WITH_LOG, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECTS_WITH_SUMMARY](context, payload) {
    await ApiService.get(
      `report/projects?start=${payload.start}&end=${payload.end}&company_id=0&status=${payload.status}`
    )
      .then(({ data }) => {
        context.commit(SET_PROJECTS_WITH_SUMMARY, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECTS_WITH_HOUR](context, payload) {
    await ApiService.get(`report/project-with-hours/${payload.id}?date=${payload.date}`)
      .then(({ data }) => {
        context.commit(SET_PROJECTS_WITH_HOUR, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_USER_REPORT](context) {
    await ApiService.get("report/users")
      .then(({ data }) => {
        context.commit(SET_USER_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_REPORT](context, payload) {
    let query = "";
    if (payload.status !== "all") {
      query = `report/projects?status=${payload.status}`;
    } else {
      query = "report/projects";
    }
    await ApiService.get(query)
      .then(({ data }) => {
        context.commit(SET_PROJECT_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_OFFER_REPORT](context, payload) {
    let query = "";
    if (payload.status !== "all") {
      query = `report/offers?status=${payload.status}`;
    } else {
      query = "report/offers";
    }
    await ApiService.get(query)
      .then(({ data }) => {
        context.commit(SET_OFFER_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_ADDRESS_REPORT](context) {
    await ApiService.get("report/addresses")
      .then(({ data }) => {
        context.commit(SET_ADDRESS_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_INVOICE_REPORT](context, payload) {
    const { status, customer, start, end } = payload;

    // Handle create query for status and customer
    let statusQuery = "status=all";
    let customerQuery = "customer=all";

    if (Array.isArray(status) && !status.includes("all")) {
      statusQuery = status.map(item => `status=${item}`).join("&");
    } else if (status && !Array.isArray(status)) {
      statusQuery = `status=${status}`;
    }

    if (Array.isArray(customer) && !customer.includes("all")) {
      customerQuery = customer.map(item => `customer=${item}`).join("&");
    } else if (customer && !Array.isArray(customer)) {
      customerQuery = `customer=${customer}`;
    }

    // Fetch api
    const apiEndpoint = `report/invoices?${statusQuery}&${customerQuery}&start=${start}&end=${end}`;
    await ApiService.get(apiEndpoint)
      .then(({ data }) => {
        context.commit(SET_INVOICE_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_EFFORT_REPORT](context, payload) {
    await ApiService.get(
      `report/project-with-rate/${payload.id}?start=${payload.start}&end=${payload.end}&filter=${payload.filter}&company_id=${payload.company_id}`
    )
      .then(({ data }) => {
        context.commit(SET_EFFORT_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_FLEXIBLE_REPORT](context, payload) {
    let query = "";
    if (payload.id === 0) {
      query = `report/user?start=${payload.start}&end=${payload.end}`;
    } else {
      query = `report/user/${payload.id}?start=${payload.start}&end=${payload.end}`;
    }
    await ApiService.get(query)
      .then(({ data }) => {
        context.commit(SET_FLEXIBLE_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_PHASE_EFFORT_REPORT](context, payload) {
    await ApiService.get(`report/project-phase-effort/${payload.id}?start=${payload.start}&end=${payload.end}`)
      .then(({ data }) => {
        context.commit(SET_PHASE_EFFORT_REPORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_USER_PROJECT_REPORT](context, payload) {
    await ApiService.get(
      `report/effort-employee-project?user_id=${payload.id}&start=${payload.start}&end=${payload.end}`
    )
      .then(({ data }) => {
        context.commit(SET_USER_PROJECT_REPORT, data);
        context.commit(SET_USER_INFO, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_ALL_INVOICES](context, payload) {
    await ApiService.get(`report/project-with-invoices/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_PROJECT_ALL_INVOICES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [EXPORT_USER_REPORT](context, payload) {
    // Set api endpoint
    const apiEndpoint = `#/report/list-user?lang=${payload.lang}&download=true`;

    context.commit(SET_USER_REPORT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_USER_REPORT_EXCEL](context, payload) {
    const accessToken = JwtService.getToken();

    const apiEndpoint = `/api/export/preview?lang=${payload.lang}&file_type=xlsx&type=report-employee&code=${accessToken}`;

    context.commit(SET_USER_REPORT_EXCEL, { code: apiEndpoint });
  },
  async [EXPORT_USER_WITH_RATE_REPORT_EXCEL](context, payload) {
    const accessToken = JwtService.getToken();

    const apiEndpoint = `/api/export/preview?lang=${payload.lang}&file_type=xlsx&type=report-employee-with-rate&code=${accessToken}`;

    context.commit(SET_USER_WITH_RATE_REPORT_EXCEL, { code: apiEndpoint });
  },
  async [EXPORT_OFFER_REPORT_EXCEL](context, payload) {
    const accessToken = JwtService.getToken();

    const status = payload.status === "all" ? "all" : payload.status;
    const apiEndpoint = `/api/export/preview?lang=${payload.lang}&file_type=xlsx&status=${status}&type=report-offer&code=${accessToken}`;

    context.commit(SET_OFFER_REPORT_EXCEL, { code: apiEndpoint });
  },
  async [EXPORT_JOB_REPORT](context, payload) {
    // Set api endpoint
    const apiEndpoint = `#/report/list-job?lang=${payload.lang}&download=true`;

    context.commit(SET_JOB_REPORT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_PROJECT_REPORT_PDF](context, payload) {
    const apiEndpoint = `#/report/list-project?lang=${payload.lang}&status=${payload.status}&download=true`;

    context.commit(SET_PROJECT_REPORT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_OFFER_REPORT_PDF](context, payload) {
    const { status, lang } = payload;
    const download = true;

    // Set api endpoint
    const apiEndpoint = `#/report/list-offer?lang=${lang}&status=${status}&download=${download}`;

    context.commit(SET_OFFER_REPORT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_ADDRESS_REPORT_PDF](context, payload) {
    const { lang } = payload;
    const download = true;

    // Set api endpoint
    const apiEndpoint = `#/report/list-address?lang=${lang}&download=${download}`;

    context.commit(SET_ADDRESS_REPORT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_INVOICE_REPORT_PDF](context, payload) {
    const { status, start, end, lang, customer } = payload;
    const download = true;
    let statusQuery = "status=all";
    let customerQuery = "customer=all";

    if (Array.isArray(status) && !status.includes("all")) {
      statusQuery = status.map(item => `status=${item}`).join("&");
    }
    if (Array.isArray(customer) && !customer.includes("all")) {
      customerQuery = customer.map(item => `customer=${item}`).join("&");
    }

    // Set api endpoint
    const apiEndpoint = `#/report/list-invoice?${statusQuery}&start=${start}&end=${end}&lang=${lang}&${customerQuery}&download=${download}`;

    context.commit(SET_INVOICE_REPORT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_PROJECT_REPORT_EXCEL](context, payload) {
    const accessToken = JwtService.getToken();
    const status = payload.status === "all" ? "all" : payload.status;
    const apiEndpoint = `/api/export/preview?lang=${payload.lang}&file_type=xlsx&status=${status}&type=report-project&code=${accessToken}`;
    context.commit(SET_PROJECT_REPORT_EXCEL, { code: apiEndpoint });
  },
  async [EXPORT_INVOICE_REPORT_EXCEL](context, payload) {
    const queries = {
      file_type: "xlsx",
      type: "report-invoices",
      start: payload.start,
      end: payload.end,
      status: payload.status,
      lang: payload.lang,
      ...(payload.customer !== 0 ? { id: payload.customer } : {}),
      code: JwtService.getToken()
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `/api/export/preview?${queriesInString}`;

    context.commit(SET_INVOICE_REPORT_EXCEL, { code: apiEndpoint });
  },
  async [EXPORT_ADDRESS_REPORT_EXCEL](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?lang=${payload.lang}&file_type=xlsx&type=report-address&code=${accessToken}`;

    context.commit(SET_ADDRESS_REPORT_EXCEL, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_EXTERNAL_REPORT](context, payload) {
    const queries = {
      lang: payload.lang,
      start: payload.start,
      end: payload.end,
      company_id: payload.company_id,
      download: true
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `#/report/list-effort-external/${payload.id}?${queriesInString}`;
    context.commit(SET_EFFORT_EXTERNAL_PDF, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_INTERNAL_REPORT](context, payload) {
    const queries = {
      lang: payload.lang,
      start: payload.start,
      end: payload.end,
      company_id: payload.company_id,
      download: true
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `#/report/list-effort-internal/${payload.id}?${queriesInString}`;
    context.commit(SET_EFFORT_INTERNAL_PDF, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_EXTERNAL_WITHOUT_RATE_REPORT](context, payload) {
    const queries = {
      lang: payload.lang,
      start: payload.start,
      end: payload.end,
      company_id: payload.company_id,
      download: true
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `#/report/list-effort-external-without-rate/${payload.id}?${queriesInString}`;
    context.commit(SET_EFFORT_EXTERNAL_WITHOUT_RATE_PDF, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_INTERNAL_WITHOUT_RATE_REPORT](context, payload) {
    const queries = {
      lang: payload.lang,
      start: payload.start,
      end: payload.end,
      company_id: payload.company_id,
      download: true
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `#/report/list-effort-internal-without-rate/${payload.id}?${queriesInString}`;
    context.commit(SET_EFFORT_INTERNAL_WITHOUT_RATE_PDF, { code: apiEndpoint });
  },
  async [EXPORT_PROJECT_BY_PHASES](context, payload) {
    const queries = {
      lang: payload.lang,
      start: payload.start,
      end: payload.end,
      company_id: payload.company_id,
      download: true
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `#/report/list-effort-by-phase/${payload.id}?${queriesInString}`;

    context.commit(SET_EXPORT_PROJECT_BY_PHASES_PDF, { code: apiEndpoint });
  },
  async [EXPORT_PROJECT_BY_TASKS](context, payload) {
    const queries = {
      lang: payload.lang,
      start: payload.start,
      end: payload.end,
      company_id: payload.company_id,
      download: true
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `#/report/list-effort-by-task/${payload.id}?${queriesInString}`;
    context.commit(SET_EXPORT_PROJECT_BY_TASKS_PDF, { code: apiEndpoint });
  },
  async [EXPORT_PROJECT_BY_ALL_INVOICES](context, payload) {
    const queries = {
      lang: payload.lang,
      file_type: "pdf",
      type: "report-project-all-invoices",
      start: payload.start,
      end: payload.end,
      id: payload.id,
      code: JwtService.getToken()
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `/api/export/preview?${queriesInString}`;
    context.commit(SET_PROJECT_BY_ALL_INVOICES_PDF, { code: apiEndpoint });
  },
  async [EXPORT_PROJECT_BY_ALL_INVOICES_EXCEL](context, payload) {
    const queries = {
      lang: payload.lang,
      file_type: "xlsx",
      type: "report-project-all-invoices",
      start: payload.start,
      end: payload.end,
      id: payload.id,
      code: JwtService.getToken()
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `/api/export/preview?${queriesInString}`;
    context.commit(SET_PROJECT_BY_ALL_INVOICES_XLSX, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_EXTERNAL_EXCEL](context, payload) {
    const queries = {
      lang: payload.lang,
      file_type: "xlsx",
      type: "report-efforts-external",
      start: payload.start,
      end: payload.end,
      id: payload.id,
      code: JwtService.getToken()
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `/api/export/preview?${queriesInString}`;
    context.commit(SET_EFFORT_EXTERNAL_XLSX, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_INTERNAL_EXCEL](context, payload) {
    const queries = {
      lang: payload.lang,
      file_type: "xlsx",
      type: "report-efforts-internal",
      start: payload.start,
      end: payload.end,
      id: payload.id,
      code: JwtService.getToken()
    };
    const queriesInString = Object.entries(queries)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");
    const apiEndpoint = `/api/export/preview?${queriesInString}`;
    context.commit(SET_EFFORT_INTERNAL_XLSX, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_EXTERNAL_WITHOUT_RATE_EXCEL](context, payload) {
    await ApiService.post(
      `report/export-project-with-rate-xlsx/${payload.id}?type=xlsx-list-effort-external-without-rate&lang=${payload.lang}&start=${payload.start}&end=${payload.end}&company_id=${payload.company_id}`
    )
      .then(({ data }) => {
        context.commit(SET_EFFORT_EXTERNAL_WITHOUT_RATE_XLSX, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [EXPORT_EFFORT_INTERNAL_WITHOUT_RATE_EXCEL](context, payload) {
    await ApiService.post(
      `report/export-project-with-rate-xlsx/${payload.id}?type=xlsx-list-effort-internal-without-rate&lang=${payload.lang}&start=${payload.start}&end=${payload.end}&company_id=${payload.company_id}`
    )
      .then(({ data }) => {
        context.commit(SET_EFFORT_INTERNAL_WITHOUT_RATE_XLSX, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  },
  async [EXPORT_FLEXIBLE_REPORT](context, payload) {
    const { id, start, end, lang } = payload;
    const download = true;

    // Set api endpoint
    const apiEndpoint = `#/report/list-flexible-and-holiday/${id}?start=${start}&end=${end}&lang=${lang}&download=${download}`;

    context.commit(SET_FLEXIBLE_PDF, { code: apiEndpoint });
  },
  async [EXPORT_EFFORT_REPORT](context, payload) {
    const { id, start, end, lang } = payload;
    const download = true;

    // Set api endpoint
    const apiEndpoint = `#/report/list-user-effort/${id}?start=${start}&end=${end}&lang=${lang}&download=${download}`;

    context.commit(SET_EFFORT_REPORT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_FLEXIBLE_REPORT_EXCEL](context, payload) {
    let query = "";
    if (payload.id === 0) {
      query = `report/export-user-flex-with-holidays-xlsx?lang=${payload.lang}&start=${payload.start}&end=${payload.end}`;
    } else {
      query = `report/export-user-flex-with-holidays-xlsx?lang=${payload.lang}&employee=${payload.id}&start=${payload.start}&end=${payload.end}`;
    }
    await ApiService.post(query)
      .then(({ data }) => {
        context.commit(SET_FLEXIBLE_XLSX, data);
      })
      .catch(({ response }) => {
        context.commit(SET_REPORT_ERROR, response.data.message);
      });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
