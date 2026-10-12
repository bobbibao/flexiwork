import { Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { RoleEnum } from 'src/shared/enums';
import { userActor } from 'src/shared/events/actor';
import { CommandContext } from 'src/shared/events/event-envelope';
import { ShiftDomainError } from '../domain/errors/shift.errors';
import { ShiftAccess } from '../application/commands/shift.commands';

const STATUS: Record<ShiftDomainError['kind'], number> = { transition: 409, rule: 422, forbidden: 403 };

/** Maps ShiftDomainError (pure domain) to the HTTP error envelope with a stable code. */
export class ShiftBaseController extends SnBaseController {
  protected fail(routeHandlerName: string, res: Response, error: unknown) {
    if (error instanceof ShiftDomainError) {
      this.logger.warn(`${routeHandlerName}: ${error.code} ${error.message}`);
      return res.status(STATUS[error.kind]).json({ error: true, code: error.code, message: error.message, details: error.details });
    }
    return super.fail(routeHandlerName, res, error);
  }

  protected access(user: User): ShiftAccess {
    if (user.role === RoleEnum.WORKER) return { kind: 'worker', userId: user.id };
    if (user.role === RoleEnum.OPS) return { kind: 'ops', userId: user.id };
    return { kind: 'employer', userId: user.id, companyId: user.company_id };
  }

  /** Correlation id = shift id (one business flow); the HTTP X-Correlation-Id stays in logs/headers. */
  protected ctx(user: User, req: { headers: Record<string, any> }): CommandContext {
    return { actor: userActor(user), idempotencyKey: req.headers['idempotency-key'] };
  }
}
