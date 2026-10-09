interface ServiceItem {
  id: string;
  checked: boolean;
  name: string;
  remaining: number;
  charged: string;
  cost: number;
  rate: number;
}

interface EffortRow {
  name: string;
  price: number;
  spent_in_hour: number;
}

interface ProjectData {
  currency: string;
  is_connected: boolean;
  invoices: any[];
}

interface DetailCost {
  total_net: number;
  total_discount: number;
}

interface PercentageOption {
  value: number;
  text: string;
}
