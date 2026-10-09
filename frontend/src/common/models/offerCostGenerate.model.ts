interface CostGenerateFactor {
    label: string;
    value: number;
  }
  
export interface OfferCostGenerate {
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