export const EXCEPTION_EVENTS = {
  CASE_OPENED: 'exception.case_opened',
  CASE_RESOLVED: 'exception.case_resolved',
} as const;

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ExceptionCasePayload {
  case_id: string;
  type: string;
  severity: ExceptionSeverity;
  subject_type: string;
  subject_id: string;
  company_id: number | null;
  status?: string;
}
