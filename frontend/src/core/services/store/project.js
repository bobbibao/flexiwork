import ApiService from "@/core/services/api.service";
import DataService from "@/core/services/data.service";
import { SET_INVOICE_ID } from "@/core/services/store/invoice";
import JwtService from "@/core/services/jwt.service";

//action types
export const GET_PROJECTS = "getProjects";
export const GET_PROJECT = "getProject";
export const GET_PROJECT_SERVICES = "getProjectServices";
export const GET_PROJECT_EFFORT = "getProjectEffort";
export const GET_PROJECT_EFFORT_BY_COMPANY = "getProjectEffortByCompany";
export const ADD_PROJECT = "addProject";
export const UPDATE_PROJECT = "updateProject";
export const DELETE_PROJECT = "deleteProject";
export const COPY_PROJECT = "copyProject";
export const COPY_PROJECT_AS_OFFER = "copyProjectAsOffer";
export const EXPORT_PROJECT_PDF = "exportProjectPdf";
export const PREVIEW_PROJECT_PDF = "previewProjectPdf";
export const EXPORT_PROJECT_DOC = "exportProjectDoc";
export const CREATE_INVOICE = "createInvoice";
export const CREATE_SERVICE_INVOICE = "createServiceInvoice";
export const CREATE_EFFORT_INVOICE = "createEffortInvoice";
export const FILTER_PROJECT = "filterProject";
export const UPDATE_PROJECT_STATUS = "updateProjectStatus";
export const GET_CONNECT_PROJECTS = "getConnectProjects";
export const GET_PROJECT_CONNECTION_LIST = "getProjectConnectionList";
export const GET_PROJECT_CONNECTION_SHARES = "getProjectConnectionShares";
export const CONNECT_PROJECT = "connectProject";
export const GET_START_INVOICE_DATE = "getStartInvoiceDate";
export const GET_PROJECTS_STATS = "getProjectsStats";

//mutation types
export const SET_PROJECT_ID = "setProjectId";
export const SET_PROJECT_ERROR = "setError";
export const SET_PROJECT_PREVIEW_ERROR = "setPreviewError";
export const SET_PROJECT_TOAST = "setProjectToast";
export const SET_PROJECTS = "setProjects";
export const SET_PROJECT = "setProject";
export const SET_PROJECT_PDF = "setProjectPdf";
export const SET_PROJECT_PREVIEW_PDF = "setProjectPreviewPdf";
export const SET_PROJECT_DOC = "setProjectDoc";
export const SET_PROJECT_INVOICES = "setProjectInvoices";
export const SET_PROJECT_SERVICES = "setProjectServices";
export const SET_PROJECT_EFFORT = "setProjectEffort";
export const SET_PROJECT_EFFORT_BY_COMPANY = "setProjectEffortByCompany";
export const SET_CONNECT_PROJECTS = "setConnectProjects";
export const SET_PROJECT_CONNECTION_LIST = "setProjectConnectionList";
export const SET_PROJECT_CONNECTION_SHARES = "setProjectConnectionShares";
export const CLEAR_CONNECTION_LIST = "clearConnectionList";
export const SET_START_INVOICE_DATE = "setStartInvoiceDate";
export const SET_PROJECTS_STATS = "setProjectsStats";

const state = {
  id: null,
  error: null,
  toast: null,
  projects: [],
  project: { customer: {}, quote_items: [], invoices: [] },
  pdf: "",
  doc: "",
  invoices: [],
  services: [],
  effort: 0,
  effort_rows: [],
  effort_by_company: 0,
  effort_by_company_rows: [],
  connect_projects: [],
  project_connection_list: [],
  project_connection_shares: [],
  invoice_date: "",
  stats: {},
  preview_pdf: null
};

const getters = {
  currentProjects(state) {
    return state.projects;
  },
  currentProject(state) {
    return state.project;
  },
  currentProjectInvoices(state) {
    return state.invoices;
  },
  projectServices(state) {
    return state.services;
  },
  projectEffort(state) {
    return state.effort;
  },
  projectEffortRows(state) {
    return state.effort_rows;
  },
  projectEffortByCompany(state) {
    return state.effort_by_company;
  },
  projectEffortByCompanyRows(state) {
    return state.effort_by_company_rows;
  },
  connectProjects(state) {
    let prjs = [];
    for (const p of state.connect_projects) {
      prjs.push({
        id: p.id,
        name: p.number.custom_id ? p.number.custom_id + " " + p.name : p.number.id + " " + p.name
      });
    }
    return prjs;
  },
  projectConnectionList(state) {
    return state.project_connection_list;
  },
  projectConnectionShares(state) {
    return state.project_connection_shares;
  },
  projectsStats(state) {
    return state.stats;
  },
  currentPreviewProjectPDF(state) {
    return state.preview_pdf;
  }
};

const mutations = {
  [SET_PROJECT_ID](state, data) {
    state.id = data;
  },
  [SET_PROJECT_ERROR](state, error) {
    state.error = error;
  },
  [SET_PROJECT_TOAST](state, data) {
    state.toast = data;
  },
  [SET_PROJECTS](state, data) {
    DataService.fillMetadata(data.payload.items);
    state.projects = data.payload.items;
    state.error = null;
  },
  [SET_PROJECT](state, data) {
    DataService.fillMetadata(data.payload);
    if (data.payload.customer) {
      DataService.fillMetadata(data.payload.customer);
    }
    if (data.payload.quote_items) {
      DataService.fillMetadata(data.payload.quote_items);
    }
    if (data.payload.invoices) {
      DataService.fillMetadata(data.payload.invoices);
    }
    const updatedPayload = {
      ...data.payload
    };
    state.project = updatedPayload;
    state.error = null;
  },
  [SET_PROJECT_PDF](state, data) {
    state.pdf = data.code;
    state.error = null;
  },
  [SET_PROJECT_PREVIEW_PDF](state, data) {
    state.preview_pdf = data;
  },
  [SET_PROJECT_DOC](state, data) {
    state.doc = data.code;
    state.error = null;
  },
  [SET_PROJECT_INVOICES](state, data) {
    state.invoices = data;
  },
  [SET_PROJECT_SERVICES](state, data) {
    state.services = data.payload;
    state.error = null;
  },
  [SET_PROJECT_EFFORT](state, data) {
    state.effort = data.payload.total;
    state.effort_rows = data.payload.rows;
    state.error = null;
  },
  [SET_PROJECT_EFFORT_BY_COMPANY](state, data) {
    state.effort_by_company = data.payload.total;
    state.effort_by_company_rows = data.payload.rows;
    state.error = null;
  },
  [SET_CONNECT_PROJECTS](state, data) {
    DataService.fillMetadata(data.payload);
    state.connect_projects = data.payload;
    state.error = null;
  },
  [SET_PROJECT_CONNECTION_LIST](state, data) {
    state.project_connection_list = data.payload;
    state.error = null;
  },
  [SET_PROJECT_CONNECTION_SHARES](state, data) {
    state.project_connection_shares = data.payload;
    state.error = null;
  },
  [CLEAR_CONNECTION_LIST](state) {
    state.project_connection_list = [];
  },
  [SET_START_INVOICE_DATE](state, data) {
    state.invoice_date = data.start_date;
    state.error = null;
  },
  [SET_PROJECTS_STATS](state, data) {
    state.stats = data.payload;
    state.error = null;
  }
};

const actions = {
  async [GET_PROJECTS](context, payload = {}) {
    const query = Object.entries(payload)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    await ApiService.get("projects" + (query ? `?${query}` : ""))
      .then(({ data }) => {
        context.commit(SET_PROJECTS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT](context, payload) {
    await ApiService.get(`project/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_PROJECT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_EFFORT](context, payload) {
    let url = `project/${payload.id}/hours?start_date=${payload.start_date}&end_date=${payload.end_date}`;
    if (payload.all_effort) {
      url = `project/${payload.id}/hours`;
    }
    await ApiService.get(url)
      .then(({ data }) => {
        context.commit(SET_PROJECT_EFFORT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_EFFORT_BY_COMPANY](context, payload) {
    let url = `project/${payload.id}/hours?start_date=${payload.start_date}&end_date=${payload.end_date}&company_id=${payload.company_id}`;
    if (payload.all_effort) {
      url = `project/${payload.id}/hours?company_id=${payload.company_id}`;
    }
    await ApiService.get(url)
      .then(({ data }) => {
        context.commit(SET_PROJECT_EFFORT_BY_COMPANY, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [ADD_PROJECT](context, payload) {
    await ApiService.post("project", payload).catch(({ response }) => {
      context.commit(SET_PROJECT_ERROR, response.data.message);
    });
  },
  async [UPDATE_PROJECT](context, payload) {
    await ApiService.put(`project/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_PROJECT_ERROR, response.data.message);
    });
  },
  async [DELETE_PROJECT](context, payload) {
    await ApiService.delete(`project/${payload.id}`).catch(({ response }) => {
      context.commit(SET_PROJECT_ERROR, response.data.message);
    });
  },
  async [COPY_PROJECT](context, payload) {
    await ApiService.post(`project/${payload.id}/copy`).catch(({ response }) => {
      context.commit(SET_PROJECT_ERROR, response.data.message);
    });
  },
  async [COPY_PROJECT_AS_OFFER](context, payload) {
    await ApiService.post(`project/${payload.id}/copy-as-offer`).catch(({ response }) => {
      context.commit(SET_PROJECT_ERROR, response.data.message);
    });
  },
  async [EXPORT_PROJECT_PDF](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=project&code=${accessToken}`;
    context.commit(SET_PROJECT_PDF, { code: apiEndpoint });
  },
  async [PREVIEW_PROJECT_PDF](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=project&code=${accessToken}&preview=true`;
    context.commit(SET_PROJECT_PDF, { code: apiEndpoint });
  },
  async [EXPORT_PROJECT_DOC](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=project&file_type=docx&code=${accessToken}`;
    context.commit(SET_PROJECT_PDF, { code: apiEndpoint });
  },
  async [CREATE_INVOICE](context, payload) {
    await ApiService.post(`project/${payload.id}/invoice`, {
      ...payload.data,
      locale: payload.locale
    })
      .then(({ data }) => {
        context.commit(SET_INVOICE_ID, data.payload.invoice_id);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [CREATE_SERVICE_INVOICE](context, payload) {
    await ApiService.post(`project/${payload.id}/service-invoice`, {
      ...payload.data,
      locale: payload.locale
    })
      .then(({ data }) => {
        context.commit(SET_INVOICE_ID, data.payload.invoice_id);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [CREATE_EFFORT_INVOICE](context, payload) {
    await ApiService.post(`project/${payload.id}/hour-invoice`, {
      ...payload.data,
      locale: payload.locale
    })
      .then(({ data }) => {
        context.commit(SET_INVOICE_ID, data.payload.invoice_id);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [FILTER_PROJECT](context, payload) {
    await ApiService.get(`projects?status=${payload.filter}`)
      .then(({ data }) => {
        context.commit(SET_PROJECTS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_SERVICES](context, payload) {
    await ApiService.get(`project/${payload.id}/services`)
      .then(({ data }) => {
        context.commit(SET_PROJECT_SERVICES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [UPDATE_PROJECT_STATUS](context, payload) {
    await ApiService.put(`projects/status`, payload.data).catch(({ response }) => {
      context.commit(SET_PROJECT_ERROR, response.data.message);
    });
  },
  async [GET_CONNECT_PROJECTS](context, payload) {
    await ApiService.get(`projects?company_id=${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_CONNECT_PROJECTS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_CONNECTION_LIST](context, payload) {
    await ApiService.get(`project/${payload.id}/pull/list`)
      .then(({ data }) => {
        context.commit(SET_PROJECT_CONNECTION_LIST, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECT_CONNECTION_SHARES](context, payload) {
    await ApiService.get(`project/${payload.id}/shares`)
      .then(({ data }) => {
        context.commit(SET_PROJECT_CONNECTION_SHARES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [CONNECT_PROJECT](context, payload) {
    context.commit(SET_PROJECT_ERROR, null);
    await ApiService.post(`project/${payload.id}/pull`, payload.data).catch(({ response }) => {
      context.commit(SET_PROJECT_ERROR, response.data.message);
    });
  },
  async [GET_START_INVOICE_DATE](context, payload) {
    context.commit(SET_PROJECT_ERROR, null);
    await ApiService.get(`project/${payload.id}/begin`)
      .then(({ data }) => {
        context.commit(SET_START_INVOICE_DATE, data.payload);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  },
  async [GET_PROJECTS_STATS](context) {
    context.commit(SET_PROJECT_ERROR, null);
    await ApiService.get(`projects/stats`)
      .then(({ data }) => {
        context.commit(SET_PROJECTS_STATS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PROJECT_ERROR, response.data.message);
      });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
