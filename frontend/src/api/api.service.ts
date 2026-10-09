import Vue from "vue";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import VueAxios from "vue-axios";
import JwtService from "../common/localStorageUtils";

const SERVER_API_BASE_URL = `/api`;
/**
 * Service to call HTTP request via Axios
 */
const ApiService = {
  init() {
    Vue.use(VueAxios, axios);
  },

  /**
   * Set the default HTTP request headers
   */
  setHeader() {
    Vue.axios.defaults.headers.common["Authorization"] = `Bearer ${JwtService.getToken()}`;
  },

  query(resource: string, params: AxiosRequestConfig = {}): Promise<AxiosResponse> {
    return Vue.axios.get(`${SERVER_API_BASE_URL}/${resource}`, { params }).catch(error => {
      throw new Error(`[KT] ApiService ${error}`);
    });
  },

  /**
   * Send the GET HTTP request
   * @param resource
   * @returns {Promise<AxiosResponse>}
   */
  get<T>(resource: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return Vue.axios.get(`${SERVER_API_BASE_URL}/${resource}`, config).catch(error => {
      throw new Error(`[KT] ApiService ${error}`);
    });
  },

  /**
   * Set the POST HTTP request
   * @param resource
   * @param params
   * @returns {Promise<AxiosResponse>}
   */
  post<T>(resource: string, params: any = {}): Promise<AxiosResponse<T>> {
    return Vue.axios.post(`${SERVER_API_BASE_URL}/${resource}`, params);
  },

  /**
   * Send the UPDATE HTTP request
   * @param resource
   * @param slug
   * @param params
   * @returns {Promise<AxiosResponse>}
   */
  update(resource: string, slug: string, params: any = {}): Promise<AxiosResponse> {
    return Vue.axios.put(`${SERVER_API_BASE_URL}/${resource}/${slug}`, params);
  },

  /**
   * Send the PUT HTTP request
   * @param resource
   * @param params
   * @returns {Promise<AxiosResponse>}
   */
  put<T>(resource: string, params: any = {}): Promise<AxiosResponse<T>> {
    return Vue.axios.put(`${SERVER_API_BASE_URL}/${resource}`, params);
  },

  /**
   * Send the DELETE HTTP request
   * @param resource
   * @returns {Promise<AxiosResponse>}
   */
  delete<T>(resource: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return Vue.axios.delete(`${SERVER_API_BASE_URL}/${resource}`, config);
  }
};

export default ApiService;
