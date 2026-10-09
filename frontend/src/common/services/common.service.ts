/* eslint-disable max-len */
import ApiService from "@/api/api.service";
import { PRODUCT_ENDPOINTS, SETTING_ENDPOINTS } from "@/api/endpoints";
import { buildQueryString } from "@/common";
import { Response } from "@/common/dtos";
import { IQueryPaginate } from "../dtos/IQueryPaginate.dto";
import { ProductResponse } from "../dtos/productReponse.dto";
import { SettingDto } from "../models/setting.model";
import { Product } from "../models/product.model";
import { ProductGroup } from "../models/productGroup.model";

export class CommonService {
  constructor() {
    ApiService.init();
    ApiService.setHeader();
  }

  async getSetting() {
    try {
      const apiEndpoint = SETTING_ENDPOINTS.GET_SETTING();

      const response = await ApiService.get<Response<SettingDto>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET SETTING: ${error}`);
    }
  }
  async getProducts(query: IQueryPaginate) {
    try {
      const { page, page_size, search, sort, folder } = query;
      const queryString = buildQueryString({ page, page_size, search, sort, folder });
      const apiEndpoint = PRODUCT_ENDPOINTS.GET_PRODUCTS(queryString);

      const response = await ApiService.get<ProductResponse<Product>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] GET PRODUCTS: ${error}`);
    }
  }
  async getGroups(query: IQueryPaginate) {
    try {
      const { page, page_size, search } = query;
      const queryString = buildQueryString({ page, page_size, search });
      const apiEndpoint = PRODUCT_ENDPOINTS.GET_PRODUCTS_GROUPS(queryString);

      const response = await ApiService.get<ProductResponse<ProductGroup>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] GET GROUPS: ${error}`);
    }
  }
}
