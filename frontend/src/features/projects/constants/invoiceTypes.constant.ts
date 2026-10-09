// Invoice Type Enum
export enum InvoiceType {
  PERCENT = "partial",
  SERVICE = "service",
  HOUR = "hour"
}

// Invoice Rates Configuration
export const INVOICE_RATES = [
  { value: 0.25, text: "25%" },
  { value: 0.5, text: "50%" },
  { value: 0.75, text: "75%" },
  { value: 1, text: "100%" }
];
