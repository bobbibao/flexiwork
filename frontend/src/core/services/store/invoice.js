import ApiService from "@/core/services/api.service";
import DataService from "@/core/services/data.service";
import JwtService from "@/core/services/jwt.service";

//action types
export const GET_INVOICES = "getInvoices";
export const GET_INVOICE = "getInvoice";
export const GET_HISTORY_INVOICES = "gethistoryInvoices";
export const ADD_INVOICE = "addInvoice";
export const UPDATE_INVOICE = "updateInvoice";
export const DELETE_INVOICE = "deleteInvoice";
export const COPY_INVOICE = "copyInvoice";
export const EXPORT_INVOICE_PDF = "exportInvoicePdf";
export const PREVIEW_INVOICE_PDF = "previewInvoicePdf";
export const EXPORT_INVOICE_DOC = "exportInvoiceDoc";
export const CANCEL_INVOICE = "cancelInvoice";
export const PAID_INVOICE = "paidInvoice";
export const FILTER_INVOICE = "filterInvoice";
export const UPDATE_INVOICE_STATUS = "updateInvoiceStatus";
export const GET_INVOICES_STATS = "getInvoicesStats";

//mutation types
export const SET_INVOICE_ID = "setInvoiceId";
export const SET_INVOICE_ERROR = "setInvoiceError";
export const SET_INVOICE_TOAST = "setInvoiceToast";
export const SET_INVOICES = "setInvoices";
export const SET_INVOICE = "setInvoice";
export const SET_INVOICE_PDF = "setInvoicePdf";
export const SET_INVOICE_PREVIEW_PDF = "setInvoicePreviewPdf";
export const SET_INVOICE_DOC = "setInvoiceDoc";
export const SET_INVOICE_HISTORY = "setInvoiceHistory";
export const SET_HISTORY_INVOICES = "setHistoryInvoices";
export const SET_HISTORY = "setHistory";
export const ADD_HISTORY = "addHistory";
export const REMOVE_HISTORY = "removeHistory";
export const RESET_HISTORY = "resetHistory";
export const SET_HISTORY_EDITED = "setHistoryEdited";
export const SET_INVOICES_STATS = "setInvoicesStats";

const state = {
  id: null,
  error: null,
  toast: null,
  invoices: [],
  invoice: { customer: {}, quote_items: [] },
  history: [],
  history_edited: false,
  history_invoices: [],
  pdf: "",
  doc: "",
  stats: {},
  preview_pdf: null
};

const getters = {
  currentInvoices(state) {
    return state.invoices;
  },
  currentInvoice(state) {
    return state.invoice;
  },
  currentPaidHistory(state) {
    return state.history;
  },
  currentHistoryInvoices(state) {
    return state.history_invoices;
  },
  invoicesStats(state) {
    return state.stats;
  },
  currentPreviewInvoicePdf(state) {
    return state.preview_pdf;
  }
};

const mutations = {
  [SET_INVOICE_ID](state, data) {
    state.id = data;
  },
  [SET_INVOICE_ERROR](state, error) {
    state.error = error;
  },
  [SET_INVOICE_TOAST](state, data) {
    state.toast = data;
  },
  [SET_INVOICES](state, data) {
    DataService.fillMetadata(data.payload);
    state.invoices = data.payload;
    state.error = null;
  },
  [SET_INVOICE](state, data) {
    DataService.fillMetadata(data.payload);
    if (data.payload.customer) {
      DataService.fillMetadata(data.payload.customer);
    }
    if (data.payload.quote_items) {
      DataService.fillMetadata(data.payload.quote_items);
    }
    state.invoice = data.payload;
    state.error = null;
  },
  [SET_INVOICE_PDF](state, data) {
    state.pdf = data.code;
    state.error = null;
  },
  [SET_INVOICE_PREVIEW_PDF](state, data) {
    state.preview_pdf = data;
  },
  [SET_INVOICE_DOC](state, data) {
    state.doc = data.code;
    state.error = null;
  },
  [SET_INVOICE_HISTORY](state, data) {
    state.history = data;
  },
  [SET_HISTORY](state, data) {
    for (let index = 0; index < state.history.length; index++) {
      const element = state.history[index];
      if (index === data.id) {
        element[data.field] = data.value;
      }
    }
  },
  [ADD_HISTORY](state, data) {
    state.history.push(data);
  },
  [REMOVE_HISTORY](state, data) {
    if (state.history.length > 1) {
      state.history.splice(data, 1);
    }
  },
  [RESET_HISTORY](state) {
    state.history = [];
  },
  [SET_HISTORY_EDITED](state, data) {
    state.history_edited = data;
  },
  [SET_HISTORY_INVOICES](state, data) {
    DataService.fillMetadata(data.payload);
    state.history_invoices = data.payload;
    state.error = null;
  },
  [SET_INVOICES_STATS](state, data) {
    state.stats = data.payload;
    state.error = null;
  }
};

const actions = {
  async [GET_INVOICES](context) {
    await ApiService.get("invoices")
      .then(({ data }) => {
        context.commit(SET_INVOICES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_INVOICE_ERROR, response.data.message);
      });
  },
  async [GET_INVOICE](context, payload) {
    await ApiService.get(`invoice/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_INVOICE, data);
      })
      .catch(({ response }) => {
        context.commit(SET_INVOICE_ERROR, response.data.message);
      });
  },
  async [GET_HISTORY_INVOICES](context, payload) {
    await ApiService.get(`invoice/${payload.id}/invoice-history`)
      .then(({ data }) => {
        context.commit(SET_HISTORY_INVOICES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_INVOICE_ERROR, response.data.message);
      });
  },
  async [ADD_INVOICE](context, payload) {
    await ApiService.post("invoice", payload).catch(({ response }) => {
      context.commit(SET_INVOICE_ERROR, response.data.message);
    });
  },
  async [UPDATE_INVOICE](context, payload) {
    await ApiService.put(`invoice/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_INVOICE_ERROR, response.data.message);
    });
  },
  async [DELETE_INVOICE](context, payload) {
    await ApiService.delete(`invoice/${payload.id}`).catch(({ response }) => {
      context.commit(SET_INVOICE_ERROR, response.data.message);
    });
  },
  async [COPY_INVOICE](context, payload) {
    await ApiService.post(`invoice/${payload.id}/copy`).catch(({ response }) => {
      context.commit(SET_INVOICE_ERROR, response.data.message);
    });
  },
  async [CANCEL_INVOICE](context, payload) {
    await ApiService.post(`invoice/${payload.id}/cancel`).catch(({ response }) => {
      context.commit(SET_INVOICE_ERROR, response.data.message);
    });
  },
  async [PAID_INVOICE](context, payload) {
    await ApiService.post(`invoice/${payload.id}/paid`, payload.data).catch(({ response }) => {
      context.commit(SET_INVOICE_ERROR, response.data.message);
    });
  },
  async [EXPORT_INVOICE_PDF](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=invoice&code=${accessToken}`;
    context.commit(SET_INVOICE_PDF, { code: apiEndpoint });
  },
  async [PREVIEW_INVOICE_PDF](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=invoice&code=${accessToken}&preview=true`;
    context.commit(SET_INVOICE_PDF, { code: apiEndpoint });
  },
  async [EXPORT_INVOICE_DOC](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=invoice&file_type=docx&code=${accessToken}`;
    context.commit(SET_INVOICE_PDF, { code: apiEndpoint });
  },
  async [FILTER_INVOICE](context, payload) {
    const url = payload?.filter !== "all" ? `invoices?status=${payload.filter}` : "invoices";
    await ApiService.get(url)
      .then(({ data }) => {
        context.commit(SET_INVOICES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_INVOICE_ERROR, response.data.message);
      });
  },
  async [UPDATE_INVOICE_STATUS](context, payload) {
    await ApiService.put(`invoices/status`, payload.data).catch(({ response }) => {
      context.commit(SET_INVOICE_ERROR, response.data.message);
    });
  },
  async [GET_INVOICES_STATS](context) {
    await ApiService.get(`invoices/stats`)
      .then(({ data }) => {
        context.commit(SET_INVOICES_STATS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_INVOICE_ERROR, response.data.message);
      });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
