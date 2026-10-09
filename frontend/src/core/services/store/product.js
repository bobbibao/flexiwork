import ApiService from "@/core/services/api.service";
import DataService from "@/core/services/data.service";

//action types
export const GET_PRODUCTS = "getProducts";
export const GET_GROUPS = "getGroups";
export const GET_PRODUCT = "getProduct";
export const GET_GROUP = "getGroup";
export const ADD_PRODUCT = "addProduct";
export const ADD_GROUP = "addGroup";
export const UPDATE_PRODUCT = "updateProduct";
export const UPDATE_GROUP = "updateGroup";
export const DELETE_PRODUCT = "deleteProduct";
export const DELETE_GROUP = "deleteGroup";

//mutation types
export const SET_PRODUCT_ID = "setProductId";
export const SET_GROUP_ID = "setGroupId";
export const SET_QUOTE_ITEMS = "setQuoteItems";
export const ADD_QUOTE_ITEMS = "addQuoteItems";
export const SET_ITEM_GROUP = "setItemGroup";
export const SET_ITEM = "setItem";
export const REMOVE_ITEM = "removeItem";
export const SET_ITEM_VALUE = "setItemValue";
export const SET_REMAININGNET = "setRemainingNet";
export const SET_REMAININGGROSS = "setRemainingGross";
export const SET_DISPERCENT = "setDiscountPercent";
export const RESET_ITEM = "resetItem";
export const SET_PRODUCTS = "setProducts";
export const SET_GROUPS = "setGroups";
export const SET_PRODUCT = "setProduct";
export const SET_GROUP = "setGroup";
export const SET_PRODUCT_ERROR = "setError";
export const SET_PRODUCT_TOAST = "setProductToast";
export const SET_VAT_COUNT = "setVatCount";
export const SET_QUOTE_EDITED = "setQuoteEdited";
export const SET_PUSH_NK = "setPushNk";
export const SET_IS_INVOICE = "setIsInvoice";

const state = {
  product_id: null,
  is_invoice: false,
  group_id: null,
  error: null,
  toast: null,
  quote_items: [],
  net_remaining: parseFloat(0).toFixed(2),
  gross_remaining: parseFloat(0).toFixed(2),
  discount_percent: 0.0,
  vat_count: 0,
  products: [],
  groups: [],
  product: {},
  group: { products: [] },
  quote_edited: false,
  push_nk: false
};

const getters = {
  quoteItems(state) {
    return state.quote_items;
  },
  remainingNet(state) {
    return state.net_remaining;
  },
  remainingGross(state) {
    return state.gross_remaining;
  },
  discountPercent(state) {
    return state.discount_percent;
  },
  currentProducts(state) {
    return state.products;
  },
  currentProduct(state) {
    return state.product;
  },
  currentGroups(state) {
    return state.groups;
  },
  currentGroup(state) {
    return state.group;
  },
  detailCost(state) {
    let total_net = 0.0,
      total_net_nk = 0.0,
      total_gross_nk = 0.0,
      total_gross = 0.0,
      total_discount = 0.0,
      total_discount_nk = 0.0,
      vat_value = 0.0,
      total_vat_list = {},
      total_init_net_by_vat = {},
      total_init_net_nk_by_vat = {};
    //init array
    state.quote_items.forEach(it => {
      if (it.type !== "individual" || it.optional !== false) return;
      total_vat_list[it.vat_rate] = 0.0;
      total_init_net_by_vat[it.vat_rate] = 0.0;
      total_init_net_nk_by_vat[it.vat_rate] = 0.0;
    });

    //process
    state.quote_items.forEach(it => {
      if (it.type !== "individual" || it.optional !== false) return;
      let is_apply_discount_to_nk = it.apply_discount ?? true;
      if (state.is_invoice) {
        is_apply_discount_to_nk = it.apply_discount ?? false;
      }
      const is_nk = it.is_nk ?? false;
      const discounted_value = it.cost * (state.discount_percent / 100);
      let cost = it.cost ?? 0.0;

      //flow for nk
      if (is_nk) {
        cost = it.price ?? 0.0;
        //if apply_discount is set
        if (is_apply_discount_to_nk) {
          cost -= discounted_value;
          total_discount_nk += discounted_value;

          if (state.is_invoice) {
            total_init_net_nk_by_vat[it.vat_rate] += discounted_value;
            let vat_value_discount = discounted_value * (it.vat_rate / 100);
            total_vat_list[it.vat_rate] += vat_value_discount;
            total_gross_nk += discounted_value + vat_value_discount;
          }
        }

        vat_value = cost * (it.vat_rate / 100);
        total_net_nk += cost;
        total_init_net_nk_by_vat[it.vat_rate] += cost;
        total_vat_list[it.vat_rate] += vat_value;
        total_gross_nk += cost + vat_value;
        return;
      }

      //flow for normal item
      cost -= discounted_value;
      total_discount += discounted_value;

      vat_value = cost * (it.vat_rate / 100);
      total_vat_list[it.vat_rate] += vat_value;
      total_init_net_by_vat[it.vat_rate] += cost;
      total_net += cost;
      total_gross += cost + vat_value;
    });

    return {
      total_net,
      total_net_nk,
      total_gross,
      total_gross_nk,
      total_discount,
      total_discount_nk,
      total_vat_list,
      total_init_net_by_vat,
      total_init_net_nk_by_vat
    };
  }
};

const mutations = {
  [SET_PRODUCT_ID](state, data) {
    state.product_id = data;
  },
  [SET_GROUP_ID](state, data) {
    state.group_id = data;
  },
  [SET_PRODUCT_ERROR](state, error) {
    state.error = error;
  },
  [SET_PRODUCT_TOAST](state, data) {
    state.toast = data;
  },
  [SET_QUOTE_ITEMS](state, data) {
    //feat: rounding all values to 0.05 on store
    for (let index = 0; index < data.length; index++) {
      if (data[index].price) data[index].price = Math.round(data[index].price / 0.05, 0) * 0.05;
      if (data[index].cost) data[index].cost = Math.round(data[index].cost / 0.05, 0) * 0.05;
    }
    state.quote_items = data;
  },
  [ADD_QUOTE_ITEMS](state, data) {
    //feat: rounding all values to 0.05 on store
    for (let index = 0; index < data.length; index++) {
      if (data[index].price) data[index].price = Math.round(data[index].price / 0.05, 0) * 0.05;
      if (data[index].cost) data[index].cost = Math.round(data[index].cost / 0.05, 0) * 0.05;
    }
    state.quote_items = [...state.quote_items, ...data];
  },
  [SET_ITEM_GROUP](state, data) {
    for (const item of data) {
      state.quote_items.push(item);
    }
  },
  [SET_ITEM](state, data) {
    state.quote_items.push(data);
  },
  [REMOVE_ITEM](state, data) {
    state.quote_items.splice(data, 1);
  },
  [SET_ITEM_VALUE](state, data) {
    for (let index = 0; index < state.quote_items.length; index++) {
      const element = state.quote_items[index];
      if (index === data.id) {
        element[data.field] = data.value;
        break;
      }
    }
  },
  [SET_REMAININGNET](state, data) {
    state.net_remaining = data;
  },
  [SET_REMAININGGROSS](state, data) {
    state.gross_remaining = data;
  },
  [SET_DISPERCENT](state, data) {
    state.discount_percent = data;
  },
  [RESET_ITEM](state) {
    state.quote_items = [];
  },
  [SET_PRODUCTS](state, data) {
    DataService.fillMetadata(data.payload);
    state.products = data.payload;
    state.error = null;
  },
  [SET_PRODUCT](state, data) {
    DataService.fillMetadata(data.payload);
    state.product = data.payload;
    state.error = null;
  },
  [SET_GROUPS](state, data) {
    DataService.fillMetadata(data.payload);
    state.groups = data.payload;
    state.error = null;
  },
  [SET_GROUP](state, data) {
    DataService.fillMetadata(data.payload);
    if (data.payload.products) {
      DataService.fillMetadata(data.payload.products);
    }
    state.group = data.payload;
    state.error = null;
  },
  [SET_VAT_COUNT](state, data) {
    state.vat_count = data;
  },
  [SET_QUOTE_EDITED](state, data) {
    state.quote_edited = data;
  },
  [SET_PUSH_NK](state, data) {
    state.push_nk = data;
  },
  [SET_IS_INVOICE](state, data) {
    state.is_invoice = data;
  }
};

const actions = {
  async [GET_PRODUCTS](context, payload) {
    await ApiService.get(`products${payload && payload.folder ? "?folder=" + payload.folder : ""}`)
      .then(({ data }) => {
        context.commit(SET_PRODUCTS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PRODUCT_ERROR, response.data.message);
      });
  },
  async [GET_GROUPS](context) {
    await ApiService.get("groups")
      .then(({ data }) => {
        context.commit(SET_GROUPS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PRODUCT_ERROR, response.data.message);
      });
  },
  async [GET_PRODUCT](context, payload) {
    await ApiService.get(`product/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_PRODUCT, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PRODUCT_ERROR, response.data.message);
      });
  },
  async [GET_GROUP](context, payload) {
    await ApiService.get(`group/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_GROUP, data);
      })
      .catch(({ response }) => {
        context.commit(SET_PRODUCT_ERROR, response.data.message);
      });
  },
  async [ADD_PRODUCT](context, payload) {
    await ApiService.post("product", payload).catch(({ response }) => {
      context.commit(SET_PRODUCT_ERROR, response.data.message);
    });
  },
  async [ADD_GROUP](context, payload) {
    await ApiService.post("group", payload).catch(({ response }) => {
      context.commit(SET_PRODUCT_ERROR, response.data.message);
    });
  },
  async [UPDATE_PRODUCT](context, payload) {
    await ApiService.put(`product/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_PRODUCT_ERROR, response.data.message);
    });
  },
  async [UPDATE_GROUP](context, payload) {
    await ApiService.put(`group/${payload.id}`, payload.data).catch(({ response }) => {
      context.commit(SET_PRODUCT_ERROR, response.data.message);
    });
  },
  async [DELETE_PRODUCT](context, payload) {
    await ApiService.delete(`product/${payload.id}`).catch(({ response }) => {
      context.commit(SET_PRODUCT_ERROR, response.data.message);
    });
  },
  async [DELETE_GROUP](context, payload) {
    await ApiService.delete(`group/${payload.id}`).catch(({ response }) => {
      context.commit(SET_PRODUCT_ERROR, response.data.message);
    });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
