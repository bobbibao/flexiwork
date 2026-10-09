import ApiService from "@/core/services/api.service";
import JwtService from "@/core/services/jwt.service";
import router from "@/router";

// action types
export const VERIFY_AUTH = "verifyAuth";
export const LOGIN = "login";
export const LOGOUT = "logout";
export const CLEAR_LOGIN = "clear_login";
export const REGISTER = "register";
export const RESET_PASS = "resetPass";
export const NEW_PASS = "newPass";
export const ACTIVE_USER = "activeUser";
export const CHANGE_PASS = "changePass";
export const CHANGE_AVATAR = "changeAvatar";
export const GET_USER_HOLIDAYS = "getUserHolidays";
export const ADD_USER_HOLIDAY = "addUserHoliday";
export const DELETE_USER_HOLIDAY = "deleteUserHoliday";

// mutation types
export const PURGE_AUTH = "logOut";
export const SET_AUTH = "setAuth";
export const SET_USER = "setUser";
export const SET_ERROR = "setError";
export const SET_ALLOWED_COMPANIES = "setAllowedCompanies";
export const SET_TOAST = "setToast";
export const SET_HOLIDAYS = "setHolidays";

const state = {
  error: null,
  user: {},
  access_token: null,
  is_authenticated: !!JwtService.getToken(),
  companies: null,
  toast: null,
  holidays: []
};

const getters = {
  currentUser(state) {
    return state.user;
  },
  isAuthenticated(state) {
    return state.is_authenticated;
  },
  currentUserHolidays(state) {
    return state.holidays;
  }
};

const actions = {
  async [LOGIN](context, credentials) {
    if (JwtService.getToken()) context.commit(PURGE_AUTH);
    await ApiService.post("login", credentials)
      .then(({ data }) => {
        context.commit(SET_AUTH, data);
      })
      .catch(({ response }) => {
        context.commit(SET_ERROR, response.data.message);
        if (response.data.companies) {
          context.commit(SET_ALLOWED_COMPANIES, response.data.companies);
        }
      });
  },
  async [LOGOUT](context) {
    await ApiService.get("logout")
      .then(() => {
        context.commit(PURGE_AUTH);
      })
      .catch(({ response }) => {
        context.commit(SET_ERROR, response.data.message);
      });
  },
  async [REGISTER](context, payload) {
    await ApiService.post("register", payload).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
    });
  },
  [CLEAR_LOGIN](context) {
    context.commit(PURGE_AUTH);
  },
  async [VERIFY_AUTH](context) {
    if (JwtService.getToken()) {
      ApiService.setHeader();
      await ApiService.get("verify")
        .then(({ data }) => {
          context.commit(SET_USER, data);
        })
        .catch(() => {
          context.commit(PURGE_AUTH);
          router.push({ name: "login" });
        });
    } else {
      context.commit(PURGE_AUTH);
    }
  },
  async [RESET_PASS](context, payload) {
    await ApiService.post("forgot-password", payload).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
      if (response.data.companies) {
        context.commit(SET_ALLOWED_COMPANIES, response.data.companies);
      }
    });
  },
  async [NEW_PASS](context, payload) {
    await ApiService.post(`forgot-password/${payload.code}`, payload.data).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
    });
  },
  async [ACTIVE_USER](context, payload) {
    await ApiService.post(`active-code/${payload.code}`, payload.data).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
    });
  },
  async [CHANGE_PASS](context, payload) {
    await ApiService.post(`change-password`, payload.data).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
    });
  },
  async [CHANGE_AVATAR](context, payload) {
    let formData = new FormData();
    formData.append("file", payload.data.file);
    await ApiService.put(`user/${payload.id}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
    });
  },
  async [GET_USER_HOLIDAYS](context) {
    await ApiService.get("holidays")
      .then(({ data }) => {
        context.commit(SET_HOLIDAYS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_ERROR, response.data.message);
      });
  },
  async [ADD_USER_HOLIDAY](context, payload) {
    await ApiService.post("holiday", payload).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
    });
  },
  async [DELETE_USER_HOLIDAY](context, payload) {
    await ApiService.delete(`holiday/${payload.id}`).catch(({ response }) => {
      context.commit(SET_ERROR, response.data.message);
    });
  }
};

const mutations = {
  [SET_ERROR](state, error) {
    state.error = error;
  },
  [SET_AUTH](state, data) {
    state.is_authenticated = !!data.payload.access_token;
    state.user = data.payload;
    state.error = null;
    JwtService.saveToken(state.user.access_token);
  },
  [SET_ALLOWED_COMPANIES](state, data) {
    state.companies = data;
  },
  [SET_USER](state, data) {
    state.is_authenticated = true;
    state.user = data.payload;
    state.error = null;
  },
  [PURGE_AUTH](state) {
    state.is_authenticated = false;
    state.user = {};
    state.error = null;
    state.companies = null;
    JwtService.destroyToken();
  },
  [SET_ALLOWED_COMPANIES](state, data) {
    state.companies = data;
  },
  [SET_TOAST](state, data) {
    state.toast = data;
  },
  [SET_HOLIDAYS](state, data) {
    state.holidays = data.payload;
    state.error = null;
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
