import { SetMetadata } from '@nestjs/common';
import { AUDIT_ACTION_METADATA_KEY, AUDIT_MODULE_METADATA_KEY } from '../constants/audit.constants';

export const AuditModule = (name: string) => SetMetadata(AUDIT_MODULE_METADATA_KEY, name);

export const AuditAction = (action: string) => SetMetadata(AUDIT_ACTION_METADATA_KEY, action);
