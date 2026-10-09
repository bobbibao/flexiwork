export * from "./project.dto";
export * from "./projectResponse.dto";
export * from "./projectStats.dto";
import { Customer } from "@/common/models/customer.model";
import { OfferQuoteItem } from "@/common/models/offerQuoteItem.model";
import { OfferCostGenerate } from "@/common/models/offerCostGenerate.model";
import { ProjectProduct } from "@/common/models";

export * from "./project.dto";

// Basic interface for Project entity
export interface IProject {
  id?: number;
  name: string;
  status: string;
  customer?: Customer;
  customer_id?: number;
  location?: string;
  date?: string;
  end_on?: string;
  title?: string;
  currency?: string;
  number?: {
    id: number;
    custom_id?: string;
  };
  assignee?: any;
  assignee_id?: number;
  is_internal?: boolean;
  company_id?: number;
  offer_id?: number;
  details?: ProjectDetail;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  is_connected?: boolean;
  invoices?: any[];
  invoice_type?: string;
}

// Project metadata containing all project-specific details
export interface ProjectDetail {
  quote_items?: ProjectProduct[];
  title?: string;
  location?: string;
  date?: string;
  category?: string;
  begin_desc?: string;
  performance_desc?: string;
  parameter_desc?: string;
  begin_break?: boolean;
  performance_break?: boolean;
  parameter_break?: boolean;
  offer_break?: boolean;
  offer_quote_break?: boolean;
  additional_break?: boolean;
  event_break?: boolean;
  events?: { label: string; value: string }[];
  end_desc?: string;
  internal_desc?: Array<{ label: string; is_active: boolean }>;
  internal_desc_custom?: string;
  cost_estimate?: Array<{ label: string; value: number; order: string; id?: string }>;
  cost_generate?: OfferCostGenerate;
  additional_desc?: string;
  offer_desc?: string;
  begin?: string;
  performance?: string;
  estimate_cost?: string;
  parameter?: string;
  offer?: string;
  additional?: string;
  event?: string;
  end?: string;
  discount_percent?: number;
  only_my_company?: boolean;
  rate_per_hour?: number;
  address?: string;
  km_dropdown?: {
    label: string;
    value: number;
  };
  additional_cost?: Array<{ label: string; is_active: boolean; value: string }>;
  selected_km_label?: string;
}

// DTO for creating a new project
export interface CreateProjectDto {
  name: string;
  customer: Customer;
  location?: string;
  date?: string;
  end_on?: string;
  title?: string;
  category?: string;
  currency?: string;
  assignee?: any;
  number?: string;
  address?: string;
  begin_desc?: string;
  end_desc?: string;
  internal_desc?: Array<{ label: string; is_active: boolean }>;
  internal_desc_custom?: string;
  quote_items?: ProjectProduct[];
  discount_percent?: number;
  km_dropdown?: {
    label: string;
    value: number;
  };
  additional_cost?: Array<{ label: string; is_active: boolean; value: string }>;
  is_internal?: boolean;
  only_my_company?: boolean;
  rate_per_hour?: number;
  begin?: string;
  performance?: string;
  parameter?: string;
  end?: string;
  additional?: string;
  additional_break?: boolean;
  additional_desc?: string;
  begin_break?: boolean;
  cost_estimate?: Array<{ label: string; value: number; order: string; id?: string }>;
  cost_generate?: OfferCostGenerate;
  estimate_cost?: string;
  event?: string;
  event_break?: boolean;
  events?: Array<{ label: string; value: string }>;
  offer?: string;
  offer_break?: boolean;
  offer_desc?: string;
  offer_quote_break?: boolean;
  parameter_break?: boolean;
  parameter_desc?: string;
  performance_break?: boolean;
  performance_desc?: string;
}

// DTO for updating an existing project (extends CreateProjectDto)
export interface UpdateProjectDto extends CreateProjectDto {
  id: number;
}

// DTO for project summary data
export interface ProjectSummaryDto {
  total_active_projects: number;
  total_project_amount: number;
  total_remaining_amount: number;
  total_open_net_amount: number;
  total_open_gross_amount: number;
}

// DTO for project detail
export interface ProjectDetailDto extends IProject {
  actual_cost: number;
  cost_percentage: number;
  is_connected: boolean;
  total_cost: number;
  total_gross: number;
  total_invoiced: number;
  total_net: number;
  total_remaining: number;
  logs?: any[];
  project_pulls?: any[];
}

// DTO to filter project listing
export interface ListProjectsRequestDto {
  company_id?: number;
  status?: string;
}

// Service item in project
export interface ServiceDto {
  uuid: string;
  name: string;
  cost: number;
  remaining: number;
  charged?: number;
  description?: string;
  is_nk?: boolean | string;
}

// Hour entry in project
export interface RowHour {
  name: string;
  spent_in_hour: number;
  price: number;
}

// DTO for generate invoice requests
export interface GenerateInvoiceDto {
  amount: number;
  percent: number;
  total: number;
  remaining: number;
  additional_cost: number;
  additional_percent: number;
  is_final: boolean;
}

// DTO for service invoice generation
export interface GenerateServiceInvoiceDto {
  service: ServiceDto[];
  total: number;
  remaining: number;
  additional_cost: number;
  additional_percent: number;
  is_final: boolean;
}

// DTO for hour invoice creation
export interface CreateInvoiceHoursDto {
  total: number;
  rows: RowHour[];
  additional_cost: number;
  additional_percent: number;
  start_date: string;
  end_date: string;
  is_final: boolean;
}

// Connection information for projects
export interface ConnectedProject {
  id: number;
  name: string;
  company_id: number;
  company_name: string;
}

// Project logs data
export interface ProjectWithLogsDto {
  id: number;
  name: string;
  location: string;
  assignee_id: number;
  logs: {
    id: number;
    description: string;
    spent_in_hour: number;
    created_at: string;
    created_by_id: number;
    project_id: number;
  }[];
}

// Project logs details
export interface ProjectWithLogsDetailsDto extends ProjectWithLogsDto {
  company_id: number;
  company_name: string;
}

// Project rate report interface
export interface ProjectWithRateReportInterface {
  id: number;
  name: string;
  created_at: string;
  spent_in_hour: number;
  description: string;
  created_by_first_name: string;
  created_by_last_name: string;
  rate_per_hour: number;
}
