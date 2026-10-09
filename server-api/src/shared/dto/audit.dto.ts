import { AuditActionEnum } from '../constants/audit.constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuditData = Record<string, any>;

export interface AuditCreateDto {
  user_id: number;
  object_id: number;
  action: AuditActionEnum;
  module: string;
  before: AuditData;
  after: AuditData;
  api_endpoint: string;
}
