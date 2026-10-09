import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoleEnum } from '../enums';
import { snConfig } from '../sn-runtime';
import { snHttpError } from '../utils/coded.error';

const SN_ROLES: string[] = [RoleEnum.WORKER, RoleEnum.OPS];
const ALLOWLIST = new Set(['/api/logout', '/health']);

/**
 * Blocks Shift Network roles (worker, ops) from legacy routes (docs/ARCHITECTURE.md §16, risk R-04).
 * Legacy users, users, tasks, work-item, report, setting, company and export controllers have no role guard;
 * a worker (company_id NULL) calling GET /api/users would list every user with company_id IS NULL.
 * An interceptor runs after all guards, so request.user is already set by JWTAuthGuard.
 */
@Injectable()
export class SnLegacyIsolationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http' || !snConfig().SN_LEGACY_ISOLATION) return next.handle();
    const req = context.switchToHttp().getRequest();
    const role: string | undefined = req.user?.role;
    if (role && SN_ROLES.includes(role)) {
      const path = String(req.originalUrl || req.url || '').split('?')[0];
      if (!path.startsWith('/api/sn/') && !ALLOWLIST.has(path)) {
        throw snHttpError(403, 'SN_ROUTE_FORBIDDEN', 'This account can only use Shift Network routes');
      }
    }
    return next.handle();
  }
}
