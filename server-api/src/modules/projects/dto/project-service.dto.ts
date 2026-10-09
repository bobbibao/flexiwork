export class ServiceDto {
  uuid: string;
  name: string;
  description?: string;
  cost: number;
  amount: number;
  unit: string;
  price: number;
  vat_rate: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  is_nk: any; // Can be boolean or other type, adjust based on actual usage
  remaining: number;
}
