export const AUDIT_MODULE_METADATA_KEY: string = 'audit_module';

export const AUDIT_ACTION_METADATA_KEY: string = 'audit_action';

export enum AuditModuleEnum {
  AUTH = 'auth',
  DASHBOARD = 'dashboard',
  TASK = 'task',
  OFFER = 'offer',
  PROJECT = 'project',
  INVOICE = 'invoice',
  EXPENSE = 'expense',
  WORK_ITEM = 'work_item',
  CUSTOMER = 'customer',
  PRODUCT = 'product',
  COMPANY = 'company',
  EXPORT = 'export',
  SETTING = 'setting',
  REPORT = 'report',
  USER = 'user',
}

export enum AuditActionEnum {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
