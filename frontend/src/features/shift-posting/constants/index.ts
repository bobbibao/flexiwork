export const EMPLOYER_TABS = ["open", "accepted", "in_progress", "awaiting_confirmation", "paid", "cancelled"] as const;
export type EmployerTab = (typeof EMPLOYER_TABS)[number];
export const DISPUTE_REASONS = ["left_early", "late", "quality", "absent", "other"];
export const FREE_CANCEL_HOURS = 12;
export const LATE_CANCEL_COMP_PCT = 30;
