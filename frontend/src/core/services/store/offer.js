import ApiService from "@/core/services/api.service";
import DataService from "@/core/services/data.service";
import { SET_PROJECT_ID } from "@/core/services/store/project";
import { ADD_QUOTE_ITEMS, SET_DISPERCENT } from "@/core/services/store/product";
import JwtService from "@/core/services/jwt.service";

//action types
export const GET_OFFERS = "getOffers";
export const GET_OFFER = "getOffer";
export const ADD_OFFER = "addOffer";
export const UPDATE_OFFER = "updateOffer";
export const DELETE_OFFER = "deleteOffer";
export const COPY_OFFER = "copyOffer";
export const EXPORT_OFFER_PDF = "exportOfferPdf";
export const PREVIEW_OFFER_PDF = "previewOfferPdf";
export const EXPORT_OFFER_DOC = "exportOfferDoc";
export const TOGGLE_OFFER = "toggleOffer";
export const ACCEPT_OFFER = "acceptOffer";
export const FILTER_OFFER = "filterOffer";
export const GENERATE_PRODUCT = "generateProduct";

//mutation types
export const SET_OFFER_ID = "setOfferId";
export const SET_OFFER_ERROR = "setOfferError";
export const SET_OFFER_TOAST = "setOfferToast";
export const SET_OFFERS = "setOffers";
export const SET_OFFER = "setOffer";
export const SET_OFFER_PDF = "setOfferPdf";
export const SET_OFFER_PREVIEW_PDF = "setOfferPreviewPdf";
export const SET_OFFER_DOC = "setOferDoc";
export const SET_KMOPTIONS = "setKmOptions";
export const SET_KM = "setKm";
export const SET_ADDCOST = "setAddCost";
export const SET_ADDCOSTS = "setAddCosts";
export const SET_ADDITIONAL_PERCENT = "setAdditionalPercent";
export const SET_ADDITIONAL_TOTAL = "setAdditionalTotal";
export const SET_ADDITIONAL_EDITED = "setAdditionalEdited";
export const SET_ESTIMATES = "setEstimates";
export const SET_ESTIMATE = "setEstimate";
export const SET_ESTIMATE_DESC = "setEstimateDesc";
export const RESET_ESTIMATE = "resetEstimate";
export const SET_ESTIMATE_EDITED = "setEstimateEdited";
export const SET_GENERATOR = "setGenerator";
export const SET_GENERATE_INPUT = "setGenerateInput";
export const RESET_GENERATOR = "resetGenerator";
export const SET_GENERATE_EDITED = "setGenerateEdited";
export const SET_EVENTS = "setEvents";
export const SET_EVENT = "setEvent";
export const ADD_EVENT = "addEvent";
export const REMOVE_EVENT = "removeEvent";
export const RESET_EVENTS = "resetEvents";
export const SET_EVENT_EDITED = "setEventEdited";
export const SET_INTERNAL_CHOICES = "setInternalChoices";
export const SET_INTERNAL_CHOICE = "setInternalChoice";
export const RESET_INTERNAL_CHOICES = "resetInternalChoices";
export const SET_INTERNAL_EDITED = "setInternalEdited";

const state = {
  id: null,
  error: null,
  toast: null,
  offers: [],
  offer: {
    customer: {},
    cost_estimate: [],
    quote_items: [],
    km_dropdown: {},
    additional_cost: [],
    events: []
  },
  km_options: [],
  km: {},
  add_cost: [],
  additional_percent: 0.0,
  additional_total: 0.0,
  generator: {},
  estimate_cost: [],
  estimate_desc: "",
  events: [],
  pdf: "",
  doc: "",
  internal_choice: [
    {
      label: "Pauschale",
      is_active: false
    },
    {
      label: "Nach Baukosten",
      is_active: false
    },
    {
      label: "Kostendach",
      is_active: false
    },
    {
      label: "Nach Aufwand",
      is_active: false
    },
    {
      label: "RG nach Phasen",
      is_active: false
    },
    {
      label: "RG Monatlich",
      is_active: false
    },
    {
      label: "RG Quartal",
      is_active: false
    },
    {
      label: "RG nach Abschluss",
      is_active: false
    }
  ],
  additional_edited: false,
  estimate_edited: false,
  event_edited: false,
  internal_edited: false,
  generate_edited: false,
  preview_pdf: null
};

const getters = {
  currentOffers(state) {
    return state.offers;
  },
  currentOffer(state) {
    return state.offer;
  },
  currentKmOptions(state) {
    return state.km_options;
  },
  selectedKm(state) {
    return state.km;
  },
  selectedAddCost(state) {
    return state.add_cost;
  },
  currentEstimateCost(state) {
    return state.estimate_cost;
  },
  currentGenerator(state) {
    return state.generator;
  },
  currentEvents(state) {
    return state.events;
  },
  additionalPercent(state) {
    return state.additional_percent;
  },
  additionalTotal(state) {
    return state.additional_total;
  },
  currentEstimateDesc(state) {
    return state.estimate_desc;
  },
  currentInternalChoices(state) {
    return state.internal_choice;
  },
  currentPreviewOfferPDF(state) {
    return state.preview_pdf;
  }
};

const mutations = {
  [SET_OFFER_ID](state, data) {
    state.id = data;
  },
  [SET_OFFER_ERROR](state, error) {
    state.error = error;
  },
  [SET_OFFER_TOAST](state, data) {
    state.toast = data;
  },
  [SET_OFFERS](state, data) {
    DataService.fillMetadata(data.payload.detailedOffers);
    state.offers = data.payload.detailedOffers;
    state.error = null;
  },
  [SET_OFFER](state, data) {
    const { details = {}, ...others } = data.payload;
    const offer = {
      ...others,
      metadata: details,
      km_dropdown: {
        label: details.selected_km_label,
        value: Number(details.selected_km_value ?? 0)
      }
    };

    DataService.fillMetadata(offer);
    if (offer.customer) {
      DataService.fillMetadata(offer.customer);
    }
    if (offer.cost_estimate) {
      DataService.fillMetadata(offer.cost_estimate);
    }
    if (offer.quote_items) {
      DataService.fillMetadata(offer.quote_items);
    }
    if (offer.km_dropdown) {
      DataService.fillMetadata(offer.km_dropdown);
    }
    if (offer.additional_cost) {
      DataService.fillMetadata(offer.additional_cost);
    }
    if (offer.events) {
      DataService.fillMetadata(offer.events);
    }
    // Assign offer `name`
    offer.name = data.payload.name;
    offer.quote_items = offer.quote_items.map(item => {
      return {
        ...item,
        vat_rate: parseFloat(item.vat_rate)
      };
    });

    state.offer = offer;
    state.error = null;
  },
  [SET_KMOPTIONS](state, data) {
    state.km_options = data;
  },
  [SET_KM](state, data) {
    state.km = data;
  },
  [SET_ADDCOSTS](state, data) {
    state.add_cost = data;
  },
  [SET_ADDCOST](state, data) {
    for (const element of state.add_cost) {
      if (element.label === data.label) {
        element.is_active = !element.is_active;
      }
    }
  },
  [SET_ESTIMATES](state, data) {
    state.estimate_cost = data;
  },
  [SET_ESTIMATE](state, data) {
    for (const item of state.estimate_cost) {
      if (item.order === data.order || item.id === data.order) {
        item.value = data.value;
      }
    }
  },
  [SET_GENERATOR](state, data) {
    state.generator = data;
  },
  [SET_GENERATE_INPUT](state, data) {
    state.generator[data.key].value = data.value;
  },
  [SET_EVENTS](state, data) {
    state.events = data;
  },
  [SET_EVENT](state, data) {
    for (let index = 0; index < state.events.length; index++) {
      const element = state.events[index];
      if (index === data.id) {
        element[data.field] = data.value;
      }
    }
  },
  [ADD_EVENT](state, data) {
    state.events.push(data);
  },
  [REMOVE_EVENT](state) {
    state.events.pop();
  },
  [RESET_ESTIMATE](state) {
    for (const item of state.estimate_cost) {
      item.value = 0.0;
    }
  },
  [RESET_GENERATOR](state) {
    state.generator = {};
  },
  [RESET_EVENTS](state) {
    for (const item of state.events) {
      item.value = "";
    }
  },
  [SET_ADDITIONAL_EDITED](state, data) {
    state.additional_edited = data;
  },
  [SET_ESTIMATE_EDITED](state, data) {
    state.estimate_edited = data;
  },
  [SET_GENERATE_EDITED](state, data) {
    state.generate_edited = data;
  },
  [SET_EVENT_EDITED](state, data) {
    state.event_edited = data;
  },
  [SET_ADDITIONAL_PERCENT](state, data) {
    state.additional_percent = data;
  },
  [SET_ADDITIONAL_TOTAL](state, data) {
    state.additional_total = data;
  },
  [SET_OFFER_PDF](state, data) {
    state.pdf = data.code;
    state.error = null;
  },
  [SET_OFFER_PREVIEW_PDF](state, data) {
    state.preview_pdf = data;
  },
  [SET_OFFER_DOC](state, data) {
    state.doc = data.code;
    state.error = null;
  },
  [SET_ESTIMATE_DESC](state, data) {
    state.estimate_desc = data;
  },
  [SET_INTERNAL_CHOICES](state, data) {
    state.internal_choice = data;
  },
  [SET_INTERNAL_CHOICE](state, data) {
    for (const item of state.internal_choice) {
      if (item.label === data.label) {
        item.is_active = data.is_active;
        break;
      }
    }
  },
  [RESET_INTERNAL_CHOICES](state) {
    state.internal_choice = state.internal_choice.map(item => ({
      label: item.label,
      is_active: false
    }));
  },
  [SET_INTERNAL_EDITED](state, data) {
    state.internal_edited = data;
  }
};

const actions = {
  async [GET_OFFERS](context) {
    await ApiService.get("offers")
      .then(({ data }) => {
        context.commit(SET_OFFERS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_OFFER_ERROR, response.data.message);
      });
  },
  async [GET_OFFER](context, payload) {
    await ApiService.get(`offer/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_OFFER, data);
      })
      .catch(({ response }) => {
        context.commit(SET_OFFER_ERROR, response.data.message);
      });
  },
  async [ADD_OFFER](context, payload) {
    await ApiService.post("offer", payload).catch(({ response }) => {
      context.commit(SET_OFFER_ERROR, response.data.message);
    });
  },
  async [UPDATE_OFFER](context, payload) {
    await ApiService.put(`offer/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_OFFER_ERROR, response.data.message);
    });
  },
  async [DELETE_OFFER](context, payload) {
    await ApiService.delete(`offer/${payload.id}`).catch(({ response }) => {
      context.commit(SET_OFFER_ERROR, response.data.message);
    });
  },
  async [COPY_OFFER](context, payload) {
    await ApiService.post(`offer/${payload.id}/copy`).catch(({ response }) => {
      context.commit(SET_OFFER_ERROR, response.data.message);
    });
  },
  async [EXPORT_OFFER_PDF](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=offer&code=${accessToken}`;

    context.commit(SET_OFFER_PDF, { code: apiEndpoint });
  },
  async [PREVIEW_OFFER_PDF](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=offer&code=${accessToken}`;
    context.commit(SET_OFFER_PDF, { code: apiEndpoint });
  },
  async [EXPORT_OFFER_DOC](context, payload) {
    const accessToken = JwtService.getToken();
    const apiEndpoint = `/api/export/preview?id=${payload.id}&type=offer&file_type=docx&code=${accessToken}`;
    context.commit(SET_OFFER_PDF, { code: apiEndpoint });
  },
  async [TOGGLE_OFFER](context, payload) {
    await ApiService.put(`offer/${payload.id}/toggle`).catch(({ response }) => {
      context.commit(SET_OFFER_ERROR, response.data.message);
    });
  },
  async [ACCEPT_OFFER](context, payload) {
    await ApiService.post(`offer/${payload.id}/accept`, payload.data)
      .then(({ data }) => {
        context.commit(SET_PROJECT_ID, data.payload.project_id);
      })
      .catch(({ response }) => {
        context.commit(SET_OFFER_ERROR, response.data.message);
      });
  },
  async [FILTER_OFFER](context, payload) {
    await ApiService.get(`offers?status=${payload.filter}`)
      .then(({ data }) => {
        context.commit(SET_OFFERS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_OFFER_ERROR, response.data.message);
      });
  },
  async [GENERATE_PRODUCT](context, payload) {
    await ApiService.post(`generate-products?type=${payload.type}`, payload.data)
      .then(({ data }) => {
        context.commit(ADD_QUOTE_ITEMS, data.quote_items);
        context.commit(SET_DISPERCENT, data.discount_percent);
        context.commit(SET_ESTIMATE_DESC, data.offer_desc);
      })
      .catch(({ response }) => {
        context.commit(SET_OFFER_ERROR, response.data.message);
      });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
