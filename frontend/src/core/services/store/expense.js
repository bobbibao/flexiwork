import ApiService from "@/core/services/api.service";
import DataService from "@/core/services/data.service";

//action types
export const GET_EXPENSES = "getExpenses";
export const GET_EXPENSE = "getExpense";
export const ADD_EXPENSE = "addExpense";
export const UPDATE_EXPENSE = "updateExpense";
export const DELETE_EXPENSE = "deleteExpense";
export const FILTER_EXPENSE = "filterExpense";

//mutation types
export const SET_EXPENSE_ID = "setExpenseId";
export const SET_EXPENSE_ERROR = "setExpenseError";
export const SET_EXPENSE_TOAST = "setExpenseToast";
export const SET_EXPENSES = "setExpenses";
export const SET_EXPENSE = "setExpense";

const state = {
  id: null,
  error: null,
  toast: null,
  expenses: [],
  expense: {}
};

const getters = {
  currentExpenses(state) {
    return state.expenses;
  },
  currentExpense(state) {
    return state.expense;
  }
};

const mutations = {
  [SET_EXPENSE_ID](state, data) {
    state.id = data;
  },
  [SET_EXPENSE_ERROR](state, error) {
    state.error = error;
  },
  [SET_EXPENSE_TOAST](state, data) {
    state.toast = data;
  },
  [SET_EXPENSES](state, data) {
    DataService.fillMetadata(data.payload);
    state.expenses = data.payload;
    state.error = null;
  },
  [SET_EXPENSE](state, data) {
    DataService.fillMetadata(data.payload);
    state.expense = data.payload;
    state.error = null;
  }
};

const actions = {
  async [GET_EXPENSES](context) {
    await ApiService.get("expenses")
      .then(({ data }) => {
        context.commit(SET_EXPENSES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_EXPENSE_ERROR, response.data.message);
      });
  },
  async [GET_EXPENSE](context, payload) {
    await ApiService.get(`expense/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_EXPENSE, data);
      })
      .catch(({ response }) => {
        context.commit(SET_EXPENSE_ERROR, response.data.message);
      });
  },
  async [ADD_EXPENSE](context, payload) {
    let formData = new FormData();

    // Append key-value pairs for formData
    Object.keys(payload).forEach(key => {
      formData.append(key, payload[key]);
    });

    await ApiService.post("expense", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).catch(({ response }) => {
      context.commit(SET_EXPENSE_ERROR, response.data.message);
    });
  },
  async [UPDATE_EXPENSE](context, payload) {
    let formData = new FormData();

    // Append key-value pairs for formData
    Object.keys(payload.data).forEach(key => {
      formData.append(key, payload.data[key]);
    });

    await ApiService.put(`expense/${payload.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).catch(({ response }) => {
      context.commit(SET_EXPENSE_ERROR, response.data.message);
    });
  },
  async [DELETE_EXPENSE](context, payload) {
    await ApiService.delete(`expense/${payload.id}`).catch(({ response }) => {
      context.commit(SET_EXPENSE_ERROR, response.data.message);
    });
  },
  async [FILTER_EXPENSE](context, payload) {
    await ApiService.get(`expenses?status=${payload.filter}`)
      .then(({ data }) => {
        context.commit(SET_EXPENSES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_EXPENSE_ERROR, response.data.message);
      });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
