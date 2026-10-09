import ApiService from "@/core/services/api.service";
import DataService from "@/core/services/data.service";

//action types
export const GET_CUSTOMERS = "getCustomers";
export const GET_CUSTOMER = "getCustomer";
export const ADD_CUSTOMER = "addCustomer";
export const UPDATE_CUSTOMER = "updateCustomer";
export const DELETE_CUSTOMER = "deleteCustomer";
export const ADD_CONTACT = "addContact";
export const UPDATE_CONTACT = "updateContact";
export const DELETE_CONTACT = "deleteContact";
export const UPLOAD_VCF = "uploadVcf";

//mutation types
export const SET_CUSTOMER_ID = "setCustomerId";
export const SET_CUSTOMER_ERROR = "setCustomerError";
export const SET_CUSTOMER_TOAST = "setCustomerToast";
export const SET_SELECTEDCUSTOMER = "setSelectedCustomer";
export const RESET_CUSTOMER = "resetCustomer";
export const SET_CUSTOMERS = "setCustomers";
export const SET_CUSTOMER = "setCustomer";
export const SET_CUSTOMER_EDITED = "setCustomerEdited";

const state = {
  id: null,
  error: null,
  toast: null,
  selected_customer: {},
  customers: [],
  customer: {},
  customer_edited: false
};

const getters = {
  selectedCustomer(state) {
    return state.selected_customer;
  },
  currentCustomers(state) {
    return state.customers;
  },
  currentCustomer(state) {
    return state.customer;
  }
};

const mutations = {
  [SET_CUSTOMER_ID](state, data) {
    state.id = data;
  },
  [SET_CUSTOMER_ERROR](state, error) {
    state.error = error;
  },
  [SET_SELECTEDCUSTOMER](state, data) {
    state.selected_customer = data;
  },
  [RESET_CUSTOMER](state) {
    state.selected_customer = {};
  },
  [SET_CUSTOMERS](state, data) {
    DataService.fillMetadata(data.payload);
    state.customers = data.payload;
    state.error = null;
  },
  [SET_CUSTOMER](state, data) {
    DataService.fillMetadata(data.payload);
    if (data.payload.contacts) {
      DataService.fillMetadata(data.payload.contacts);
    }
    state.customer = data.payload;
    state.error = null;
  },
  [SET_CUSTOMER_TOAST](state, data) {
    state.toast = data;
  },
  [SET_CUSTOMER_EDITED](state, data) {
    state.customer_edited = data;
  }
};

const actions = {
  async [GET_CUSTOMERS](context) {
    await ApiService.get("customers")
      .then(({ data }) => {
        context.commit(SET_CUSTOMERS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_CUSTOMER_ERROR, response.data.message);
      });
  },
  async [GET_CUSTOMER](context, payload) {
    await ApiService.get(`customer/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_CUSTOMER, data);
      })
      .catch(({ response }) => {
        context.commit(SET_CUSTOMER_ERROR, response.data.message);
      });
  },
  async [ADD_CUSTOMER](context, payload) {
    await ApiService.post("customer", payload).catch(({ response }) => {
      context.commit(SET_CUSTOMER_ERROR, response.data.message);
    });
  },
  async [UPDATE_CUSTOMER](context, payload) {
    await ApiService.put(`customer/${payload.id}`, payload.data).catch(
      ({ response }) => {
        context.commit(SET_CUSTOMER_ERROR, response.data.message);
      }
    );
  },
  async [DELETE_CUSTOMER](context, payload) {
    await ApiService.delete(`customer/${payload.id}`).catch(({ response }) => {
      context.commit(SET_CUSTOMER_ERROR, response.data.message);
    });
  },
  async [ADD_CONTACT](context, payload) {
    await ApiService.post(`customer/${payload.id}/contact`, payload.data).catch(
      ({ response }) => {
        context.commit(SET_CUSTOMER_ERROR, response.data.message);
      }
    );
  },
  async [UPDATE_CONTACT](context, payload) {
    await ApiService.put(
      `customer/${payload.id}/contact/${payload.contact_id}`,
      payload.data
    ).catch(({ response }) => {
      context.commit(SET_CUSTOMER_ERROR, response.data.message);
    });
  },
  async [DELETE_CONTACT](context, payload) {
    await ApiService.delete(
      `customer/${payload.id}/contact/${payload.contact_id}`
    ).catch(({ response }) => {
      context.commit(SET_CUSTOMER_ERROR, response.data.message);
    });
  },
  async [UPLOAD_VCF](context, payload) {
    let formData = new FormData();
    formData.append("file", payload.file);
    await ApiService.post("uploadvcf", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).catch(({ response }) => {
      context.commit(SET_CUSTOMER_ERROR, response.data.message);
    });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
