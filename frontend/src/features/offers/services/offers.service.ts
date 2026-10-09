/* eslint-disable max-len */
import ApiService from "@/api/api.service";
import { OFFER_ENDPOINTS, SETTING_ENDPOINTS } from "@/api/endpoints";
import { IGeneratedProducts, IQueryOffer, OfferResponse } from "../dtos";
import { buildQueryString } from "@/common";
import { Response, PaginatedResponse } from "@/common/dtos";
import { Offer } from "@/common/models/offers.model";
import { Customer } from "@/common/models/customer.model";
import { SettingDto } from "@/common/models/setting.model";
import { OfferCostGenerate } from "@/common/models/offerCostGenerate.model";
import { CreateOfferDto } from "@/common/dtos/createOffer.dto";
import DataService from "@/core/services/data.service";

export class OffersService {
  constructor() {
    ApiService.init();
    ApiService.setHeader();
  }

  async getOffers(query: IQueryOffer) {
    try {
      const { page, page_size, search, status, sort } = query;
      const queryString = buildQueryString({ status, page, page_size, search, sort });
      const apiEndpoint = OFFER_ENDPOINTS.GET_OFFERS(queryString);

      const response = await ApiService.get<OfferResponse<Offer[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_OFFER: ${error}`);
    }
  }

  async getOffer(offerId: number) {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.GET_OFFER(offerId);

      const response = await ApiService.get<Response<Offer>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_OFFER: ${error}`);
    }
  }
  async updateOffer(offerId: number, offer: CreateOfferDto) {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.UPDATE_OFFER(offerId);

      const response = await ApiService.put<Response<Offer>>(apiEndpoint, offer);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] UPDATE_OFFER: ${error}`);
    }
  }

  async deleteOffer(offerId: number) {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.DELETE_OFFER(offerId);

      const response = await ApiService.delete<Response<void>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error(`[ERROR] DELETE_OFFER: ${error}`);
    }
  }

  async bulkDeleteOffer(offerIds: number[]): Promise<Response<void>> {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.BULK_DELETE_OFFERS();

      const response = await ApiService.delete<Response<void>>(apiEndpoint, {
        data: {
          ids: offerIds
        }
      });
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] BULK_DELETE_OFFERS: ${error}`);
    }
  }

  async copyOffer(offerId: number): Promise<Response<void>> {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.COPY_OFFER(offerId);

      const response = await ApiService.post<Response<void>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] COPY_OFFER: ${error}`);
    }
  }

  async printOffer(offerId: number, fileType: "pdf" | "docx" = "pdf", isPreview: boolean = false) {
    try {
      const ID_TOKEN_KEY = "access_token";

      const getToken = localStorage.getItem(ID_TOKEN_KEY);

      window.open(
        `/api/export/preview?id=${offerId}&type=offer&file_type=${fileType}&code=${getToken}&preview=${isPreview}`
      );
    } catch (error) {
      throw new Error(`[ERROR] PRINT_OFFER: ${error}`);
    }
  }

  async bulkPrintOffer(offerIds: number[]) {
    try {
      const ID_TOKEN_KEY = "access_token";
      const getToken = localStorage.getItem(ID_TOKEN_KEY);

      offerIds.forEach(offerId => {
        window.open(`/api/export/preview?id=${offerId}&type=offer&code=${getToken}`);
      });
    } catch (error) {
      throw new Error(`[ERROR] PRINT_OFFER: ${error}`);
    }
  }

  async getCustomers() {
    try {
      const response = await ApiService.get<Response<Customer[]>>("customers");
      return DataService.fillMetadata(response.data.payload);
    } catch (error) {
      throw new Error(`[ERROR] GET_CUSTOMERS: ${error}`);
    }
  }

  async getCompany() {
    try {
      const response = await ApiService.get<Response<any>>("company"); // FIXME: Move to setting service
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_COMPANY: ${error}`);
    }
  }

  async getOfferSettings() {
    try {
      const apiEndpoint = SETTING_ENDPOINTS.GET_SETTING();
      const response = await ApiService.get<Response<SettingDto>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload?.offer;
    } catch (error) {
      throw new Error(`[ERROR] GET_OFFER_SETTINGS: ${error}`);
    }
  }

  async generateProducts(costGenerate: OfferCostGenerate, q: string) {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.GENERATE_PRODUCTS(q);
      const response = await ApiService.post<IGeneratedProducts>(apiEndpoint, costGenerate);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] CREATE_OFFER: ${error}`);
    }
  }

  async createOffer(data: CreateOfferDto): Promise<void> {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.CREATE_OFFER();
      const response = await ApiService.post<Response<void>>(apiEndpoint, data);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error(`[ERROR] CREATE_OFFER: ${error}`);
    }
  }

  async acceptOffer(offerId: number, payload: { end_on: string }) {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.ACCEPT_OFFER(offerId);
      const response = await ApiService.post<Response<any>>(apiEndpoint, payload);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] ACCEPT_OFFER: ${error}`);
    }
  }

  async toggleOfferStatus(id: number) {
    try {
      const apiEndpoint = OFFER_ENDPOINTS.TOGGLE_OFFER_STATUS(id);
      const response = await ApiService.put<Response<void>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error(`[ERROR] TOGGLE_OFFER_STATUS: ${error}`);
    }
  }
}
