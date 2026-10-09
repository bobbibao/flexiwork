import { InvoiceDetailDto } from 'src/modules/invoices/dto/invoice-detail.dto';
import { OfferDetailDto } from 'src/modules/offers/dto/offer-detail.dto';
import { ProjectDetailDto } from 'src/modules/projects/dto/project-detail.dto';

export class SummaryResponseDto {
  offers: OfferDetailDto[];
  projects: ProjectDetailDto[];
  invoices: InvoiceDetailDto[];
  total_offer_net_amount: number;
  total_offer_gross_amount: number;
  total_open_gross_amount: number;
  total_open_net_amount: number;
  total_project_amount: number;
  total_remaining_amount: number;
}
