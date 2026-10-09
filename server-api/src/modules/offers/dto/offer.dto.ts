import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import Customer from 'src/database/models/customers.model';
import OfferQuoteItem from 'src/database/models/offer-quote-item.model';

class InternalDescription {
  id: number;
  label: string;
  is_active: boolean;
}

class CostEstimate {
  id: number;
  order: string;
  label: string;
  value: number;
}

class CostGenerateFactor {
  label: string;
  value: number;
}

class CostGenerate {
  adjustment_factor: CostGenerateFactor;
  advertised: CostGenerateFactor;
  basic_factor: CostGenerateFactor;
  building_cost: CostGenerateFactor;
  coefficients_z1: CostGenerateFactor;
  coefficients_z2: CostGenerateFactor;
  construction_cost: CostGenerateFactor;
  difficulty_lv: CostGenerateFactor;
  special_service_factor: CostGenerateFactor;
  team_factor: CostGenerateFactor;
  time: CostGenerateFactor;
  u_factor: CostGenerateFactor;
}

class AdditionalCost {
  id: number;
  label: string;
  value: number;
  is_active: boolean;
}

class OfferEvent {
  id: number;
  label: string;
  value: string;
}

class OfferDto {
  @ApiProperty({
    description: "Offer's name",
    example: 'Testobjekt für die neuen Dienstleitungen',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "Offer's location",
    example: 'Zürich',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: "Offer's date",
    example: '2024-01-30',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: "Offer's title",
    example: 'Honorarofferte',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: "Offer's category",
    example: 'Architektur',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: "Offer's begin heading",
    example: '1. Rahmenbedingungen',
  })
  @IsString()
  @IsOptional()
  begin?: string;

  @ApiPropertyOptional({
    description: "Offer's performance heading",
    example: '2. Leistungsumfang',
  })
  @IsString()
  @IsOptional()
  performance?: string;

  @ApiPropertyOptional({
    description: "Offer's estimate cost heading",
    example: '3. Anlagekosten (+-25%)',
  })
  @IsString()
  @IsOptional()
  estimate_cost?: string;

  @ApiPropertyOptional({
    description: "Offer's parameter heading",
    example: '3. Honorarparameter (Alternativ Kostenschätzung)',
  })
  @IsString()
  @IsOptional()
  parameter?: string;

  @ApiPropertyOptional({
    description: "Offer's offer heading",
    example: '4. Honorarofferte',
  })
  @IsString()
  @IsOptional()
  offer?: string;

  @ApiPropertyOptional({
    description: "Offer's additional heading",
    example: '5. Nebenkosten',
  })
  @IsString()
  @IsOptional()
  additional?: string;

  @ApiPropertyOptional({
    description: "Offer's event heading",
    example: '6. Terminziele',
  })
  @IsString()
  @IsOptional()
  event?: string;

  @ApiPropertyOptional({
    description: "Offer's end heading",
    example: '7. Ende des Textes',
  })
  @IsString()
  @IsOptional()
  end?: string;

  @ApiPropertyOptional({
    description: "Offer's begin description",
    example: '<p>Lorem ipsum dolor sit amet</p>',
  })
  @IsString()
  @IsOptional()
  begin_desc?: string;

  @ApiPropertyOptional({
    description: "Offer's performance description",
    example: '<p>Lorem ipsum dolor sit amet</p>',
  })
  @IsString()
  @IsOptional()
  performance_desc?: string;

  @ApiPropertyOptional({
    description: "Offer's parameter description",
    example: '<p>Lorem ipsum dolor sit amet</p>',
  })
  @IsString()
  @IsOptional()
  parameter_desc?: string;

  @ApiPropertyOptional({
    description: "Offer's offer description",
    example: '<p>Lorem ipsum dolor sit amet</p>',
  })
  @IsString()
  @IsOptional()
  offer_desc?: string;

  @ApiPropertyOptional({
    description: "Offer's additional description",
    example: '<p>Lorem ipsum dolor sit amet</p>',
  })
  @IsString()
  @IsOptional()
  additional_desc?: string;

  @ApiPropertyOptional({
    description: "Offer's end description",
    example: '<p>Lorem ipsum dolor sit amet</p>',
  })
  @IsString()
  @IsOptional()
  end_desc?: string;

  @ApiPropertyOptional({
    description: "Offer's internal description",
    type: [InternalDescription],
    example: [
      {
        label: 'Lorem ipsum dolor sit amet',
        is_active: true,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  internal_desc?: InternalDescription[];

  @ApiPropertyOptional({
    description: "Offer's internal description custom",
    example: 'Lorem ipsum dolor sit amet',
  })
  @IsString()
  @IsOptional()
  internal_desc_custom?: string;

  @ApiProperty({ type: Customer })
  @IsNotEmpty()
  customer: Customer;

  @ApiProperty({
    description: "Offer's cost estimate",
    type: [CostEstimate],
  })
  @IsArray()
  @IsOptional()
  cost_estimate: CostEstimate[];

  @ApiPropertyOptional({
    description: "Offer's cost generate",
    type: CostGenerate,
  })
  @IsOptional()
  cost_generate?: CostGenerate;

  @ApiPropertyOptional({
    description: "Offer's quote items",
  })
  @IsArray()
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quote_items?: OfferQuoteItem[];

  @ApiPropertyOptional({
    description: "Offer's selected kilometers",
  })
  @IsOptional()
  km_dropdown?: {
    label: string;
    value: number;
  };

  @ApiPropertyOptional({
    description: "Offer's additional cost",
    type: [AdditionalCost],
  })
  @IsArray()
  @IsOptional()
  additional_cost?: AdditionalCost[];

  @ApiPropertyOptional({
    description: "Offer's events",
  })
  @IsArray()
  @IsOptional()
  events?: OfferEvent[];

  @ApiPropertyOptional({
    description: "Offer's discount percent",
  })
  @IsNumber()
  @IsOptional()
  discount_percent?: number;

  @ApiPropertyOptional({
    description: "Offer's begin break",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  begin_break?: boolean;

  @ApiPropertyOptional({
    description: "Offer's performance break",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  performance_break?: boolean;

  @ApiPropertyOptional({
    description: "Offer's parameter break",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  parameter_break?: boolean;

  @ApiPropertyOptional({
    description: "Offer's offer break",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  offer_break?: boolean;

  @ApiPropertyOptional({
    description: "Offer's offer quote break",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  offer_quote_break?: boolean;

  @ApiPropertyOptional({
    description: "Offer's additional break",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  additional_break?: boolean;

  @ApiPropertyOptional({
    description: "Offer's event break",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  event_break?: boolean;

  @ApiProperty({
    description: "Offer's currency",
    example: 'CHF',
  })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateOfferDto extends OfferDto{}
export class CreateOfferDto extends OfferDto{}