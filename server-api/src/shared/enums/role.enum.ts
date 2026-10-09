export enum RoleEnum {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  /** Shift Network: casual worker (users.company_id IS NULL) */
  WORKER = 'worker',
  /** Shift Network: platform operations staff */
  OPS = 'ops',
}
