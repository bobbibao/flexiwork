interface VatRate {
  value: number;
  isDefault: boolean;
}

export const DEFAULT_VAT_RATES: VatRate[] = [
  {
    value: 8.1,
    isDefault: true,
  },
  {
    value: 7.7,
    isDefault: false,
  },
  {
    value: 3.8,
    isDefault: false,
  },
  {
    value: 3.7,
    isDefault: false,
  },
  {
    value: 2.6,
    isDefault: false,
  },
  {
    value: 2.5,
    isDefault: false,
  },
  {
    value: 0,
    isDefault: false,
  },
];
