import ApiService from "@/core/services/api.service";

// action types
export const GET_SETTINGS = "getSettings";
export const GET_UNITS = "getUnits";
export const GET_VAT = "getVat";
export const GET_COMPANY = "getCompany";
export const GET_USERS = "getUsers";
export const GET_USER = "getUser";
export const GET_SIMPLE_USERS = "getSimpleUsers";
export const GET_CONNECTIONS = "getConnections";
export const UPDATE_MASTER_SETTING = "updateMasterSetting";
export const UPDATE_OFFER_SETTING = "updateOfferSetting";
export const UPDATE_PROJECT_SETTING = "updateProjectSetting";
export const UPDATE_INVOICE_SETTING = "updateInvoiceSetting";
export const UPDATE_TIMESHEET_SETTING = "updateTimesheetSetting";
export const UPDATE_PRODUCT_SETTING = "updateProductSetting";
export const UPDATE_PDF_SETTING = "updatePdfSetting";
export const ADD_UNIT = "addUnit";
export const UPDATE_UNIT = "updateUnitSetting";
export const ADD_VAT = "addVat";
export const UPDATE_VAT = "updateVatSetting";
export const ADD_USER = "addUser";
export const UPDATE_USER = "updateUser";
export const DELETE_USER = "deleteUser";
export const UPDATE_USER_STATUS = "updateUserStatus";
export const UPDATE_LOGO = "updateLogo";
export const UPDATE_USER_WORKLOAD = "updateUserWorkload";
export const ADD_CONNECTION = "addConnection";
export const DELETE_CONNECTION = "deleteConnection";
export const GENERATE_SIGNATURE = "generateSignature";
export const REFRESH_USER_HOLIDAY = "refreshUserHoliday";

// mutation types
export const SET_SETTINGS = "setSettings";
export const SET_SETTING_ERROR = "setError";
export const SET_UNITS = "setUnits";
export const SET_VAT = "setVat";
export const SET_COMPANY = "setCompany";
export const SET_USERS = "setUsers";
export const SET_USER_CRUD = "setUserCrud";
export const SET_SIMPLE_USERS = "setSimpleUsers";
export const SET_CONNECTIONS = "setConnections";

const state = {
  error: null,
  company: {
    name: "",
    language: "",
    currency: "CHF"
  },
  settings: {
    master_data: {
      company: "",
      address: "",
      country: "",
      email: "",
      phone: "",
      place: "",
      postcode: "",
      fax: "",
      web: "",
      konto: "",
      mwst: "",
      bank: "",
      clearing_num: "",
      iban: "",
      revenues: {},
      allow_to_use_other_currencies: false,
      currencies: []
    },
    offer: {
      begin: "",
      performance: "",
      parameter: "",
      estimate_cost: "",
      offer: "",
      additional: "",
      event: "",
      end: "",
      begin_desc: "",
      performance_desc: "",
      parameter_desc: "",
      offer_desc: "",
      additional_desc: "",
      end_desc: "",
      km_dropdown_setting: [
        {
          label: "",
          value: 0.0
        }
      ],
      add_cost_setting: [
        {
          label: "",
          value: 0.0
        }
      ],
      event_setting: [
        {
          label: "",
          value: ""
        }
      ],
      subtitle_setting: [
        {
          label: ""
        }
      ],
      generate_setting: {
        coefficients_z1: {
          label: "",
          value: 0.0
        },
        coefficients_z2: {
          label: "",
          value: 0.0
        },
        basic_factor: {
          label: "",
          value: 0.0
        },
        construction_cost: {
          label: "",
          value: 0.0
        },
        building_cost: {
          label: "",
          value: 0.0
        },
        difficulty_lv: {
          label: "",
          value: 0.0
        },
        special_service_factor: {
          label: "",
          value: 0.0
        },
        adjustment_factor: {
          label: "",
          value: 0.0
        },
        team_factor: {
          label: "",
          value: 0.0
        },
        u_factor: {
          label: "",
          value: 0.0
        },
        time: {
          label: "",
          value: 0.0
        },
        advertised: {
          label: "",
          value: 0.0
        },
        discount: {
          label: "",
          value: 0.0
        }
      },
      estimate_setting: [
        {
          order: "00",
          label: "Grundstück",
          value: 0.0
        },
        {
          order: "01",
          label: "Vorbereitung",
          value: 0.0
        },
        {
          order: "02",
          label: "Gebäudekosten (inkl. Honorare)",
          value: 0.0
        },
        {
          order: "03",
          label: "Betriebseinrichtung",
          value: 0.0
        },
        {
          order: "04",
          label: "Umgebung",
          value: 0.0
        },
        {
          order: "05",
          label: "Baunebenkosten",
          value: 0.0
        },
        {
          order: "09",
          label: "Ausstattung",
          value: 0.0
        }
      ]
    },
    project: {
      duration: 0.0,
      begin: "",
      end: "",
      begin_desc: "",
      end_desc: ""
    },
    invoice: {
      payment_deadline: 0.0,
      reminder1_payment_deadline: 0.0,
      reminder2_payment_deadline: 0.0,
      begin: "",
      end: "",
      partial_begin: "",
      partial_end: "",
      begin_desc: "",
      end_desc: "",
      partial_begin_desc: "",
      partial_end_desc: "",
      reminder1_begin_desc: "",
      reminder2_begin_desc: "",
      reminder1_end_desc: "",
      reminder2_end_desc: ""
    },
    pdf_layout: {
      address_position: "",
      logo: "",
      logo_position: "",
      pdf_font: "",
      scaling: 0,
      show_footer: true,
      show_header: true,
      show_page_numbers: true
    },
    timesheet: {
      must_working_hours: 0.0,
      holidays: [
        {
          label: "",
          date: ""
        }
      ]
    }
  },
  units: [
    {
      id: 0,
      name: "",
      description: "",
      is_visible: true,
      time_recording_active: false,
      is_default: false
    }
  ],
  vat: [
    {
      id: 0,
      rate: 0.0,
      is_default: false,
      is_visible: true
    }
  ],
  users: [
    {
      id: 0,
      email: "",
      role: "",
      is_active: true
    }
  ],
  user: {},
  simple_users: [],
  connections: []
};

const getters = {
  currentSettings(state) {
    return state.settings;
  },
  currentUnits(state) {
    return state.units;
  },
  currentVatRates(state) {
    return state.vat;
  },
  currentCompany(state) {
    return state.company;
  },
  currentUsers(state) {
    return state.users;
  },
  currentUserSetting(state) {
    return state.user;
  },
  currentSimpleUsers(state) {
    return state.simple_users;
  },
  currentConnections(state) {
    return state.connections;
  }
};

const mutations = {
  [SET_SETTING_ERROR](state, error) {
    state.error = error;
  },
  [SET_SETTINGS](state, data) {
    state.settings = data.payload;
    state.error = null;
  },
  [SET_UNITS](state, data) {
    state.units = data.payload;
    state.error = null;
  },
  [SET_VAT](state, data) {
    state.vat = data.payload;
    state.error = null;
  },
  [SET_COMPANY](state, data) {
    state.company = data.payload;
    state.error = null;
  },
  [SET_USERS](state, data) {
    state.users = data.payload;
    state.error = null;
  },
  [SET_USER_CRUD](state, data) {
    const reformattedPayload = {
      ...data.payload,
      holiday_periods: Array.isArray(JSON.parse(data.payload.holiday_periods))
        ? JSON.parse(data.payload.holiday_periods)
        : []
    };
    state.user = reformattedPayload;
    state.error = null;
  },
  [SET_SIMPLE_USERS](state, data) {
    state.simple_users = data.payload;
    state.error = null;
  },
  [SET_CONNECTIONS](state, data) {
    state.connections = data.payload;
    state.error = null;
  }
};

const actions = {
  async [GET_SETTINGS](context) {
    await ApiService.get("setting")
      .then(({ data }) => {
        context.commit(SET_SETTINGS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [GET_UNITS](context) {
    await ApiService.get("units")
      .then(({ data }) => {
        context.commit(SET_UNITS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [GET_VAT](context) {
    await ApiService.get("vatrates")
      .then(({ data }) => {
        context.commit(SET_VAT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [GET_COMPANY](context) {
    await ApiService.get("company")
      .then(({ data }) => {
        context.commit(SET_COMPANY, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [GET_USERS](context) {
    await ApiService.get("users")
      .then(({ data }) => {
        context.commit(SET_USERS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [GET_USER](context, payload) {
    await ApiService.get(`user/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_USER_CRUD, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [GET_SIMPLE_USERS](context) {
    await ApiService.get("simple-users")
      .then(({ data }) => {
        context.commit(SET_SIMPLE_USERS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [GET_CONNECTIONS](context) {
    await ApiService.get("company/shares")
      .then(({ data }) => {
        context.commit(SET_CONNECTIONS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_SETTING_ERROR, response.data.message);
      });
  },
  async [UPDATE_MASTER_SETTING](context, payload) {
    await ApiService.post("setting/masterdata", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_OFFER_SETTING](context, payload) {
    await ApiService.post("setting/offer", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_PROJECT_SETTING](context, payload) {
    await ApiService.post("setting/project", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_INVOICE_SETTING](context, payload) {
    payload.payment_deadline = parseFloat(payload.payment_deadline);
    payload.reminder1_payment_deadline = parseFloat(payload.reminder1_payment_deadline);
    payload.reminder2_payment_deadline = parseFloat(payload.reminder2_payment_deadline);
    await ApiService.post("setting/invoice", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_TIMESHEET_SETTING](context, payload) {
    await ApiService.post("setting/timesheet", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_PRODUCT_SETTING](context, payload) {
    await ApiService.post("setting/product", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_PDF_SETTING](context, payload) {
    payload.scaling = parseFloat(payload.scaling);
    await ApiService.post("setting/pdflayout", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [ADD_UNIT](context, payload) {
    await ApiService.post("unit", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_UNIT](context, payload) {
    await ApiService.put(`unit/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [ADD_VAT](context, payload) {
    await ApiService.post("vatrate", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_VAT](context, payload) {
    await ApiService.put(`vatrate/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [ADD_USER](context, payload) {
    await ApiService.post("user", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_USER](context, payload) {
    await ApiService.put(`user/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [DELETE_USER](context, payload) {
    await ApiService.delete(`user/${payload.id}`).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_LOGO](context, payload) {
    let formData = new FormData();
    formData.append("file", payload.file);
    await ApiService.put("setting/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_USER_WORKLOAD](context, payload) {
    await ApiService.put(`user/${payload.id}/timesheet-periods`, payload.data).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [UPDATE_USER_STATUS](context, payload) {
    await ApiService.put(`user/${payload.id}/status`, payload.data).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [ADD_CONNECTION](context, payload) {
    await ApiService.post("company/connect", payload).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [DELETE_CONNECTION](context, payload) {
    await ApiService.delete(`company/remove/${payload.signature}`).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [GENERATE_SIGNATURE](context) {
    await ApiService.get("company/newsign").catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  },
  async [REFRESH_USER_HOLIDAY](context, payload) {
    await ApiService.post(`user/${payload.id}/refresh-holiday`).catch(({ response }) => {
      context.commit(SET_SETTING_ERROR, response.data.message);
    });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
