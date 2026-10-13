import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import JwtService from "../common/localStorageUtils";

const SERVER_API_BASE_URL = `/api`;
/**
 * Service to call HTTP request via Axios
 */
const ApiService = {
  init() {
    // Vue 3: axios is used directly (the Vue.axios global from vue-axios is not available)
  },

  /**
   * Set the default HTTP request headers
   */
  setHeader() {
    axios.defaults.headers.common["Authorization"] = `Bearer ${JwtService.getToken()}`;
  },

  query(resource: string, params: AxiosRequestConfig = {}): Promise<AxiosResponse> {
    return axios.get(`${SERVER_API_BASE_URL}/${resource}`, { params }).catch(error => {
      throw new Error(`[KT] ApiService ${error}`);
    });
  },

  /**
   * Send the GET HTTP request
   * @param resource
   * @returns {Promise<AxiosResponse>}
   */
  get<T>(resource: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return axios.get(`${SERVER_API_BASE_URL}/${resource}`, config).catch(error => {
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
    return axios.post(`${SERVER_API_BASE_URL}/${resource}`, params);
  },

  /**
   * Send the UPDATE HTTP request
   * @param resource
   * @param slug
   * @param params
   * @returns {Promise<AxiosResponse>}
   */
  update(resource: string, slug: string, params: any = {}): Promise<AxiosResponse> {
    return axios.put(`${SERVER_API_BASE_URL}/${resource}/${slug}`, params);
  },

  /**
   * Send the PUT HTTP request
   * @param resource
   * @param params
   * @returns {Promise<AxiosResponse>}
   */
  put<T>(resource: string, params: any = {}): Promise<AxiosResponse<T>> {
    return axios.put(`${SERVER_API_BASE_URL}/${resource}`, params);
  },

  /**
   * Send the DELETE HTTP request
   * @param resource
   * @returns {Promise<AxiosResponse>}
   */
  delete<T>(resource: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return axios.delete(`${SERVER_API_BASE_URL}/${resource}`, config);
  }
};

export default ApiService;
