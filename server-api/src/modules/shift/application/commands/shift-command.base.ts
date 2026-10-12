import { Logger } from '@nestjs/common';
import { ConcurrencyError } from 'src/shared/event-store/concurrency.error';
import { CommandContext } from 'src/shared/events/event-envelope';
import { notFound } from 'src/shared/utils/coded.error';
import { Shift } from '../../domain/shift.aggregate';
import { ShiftRepository } from '../shift.repository';
import { ShiftAccess } from './shift.commands';

const MAX_RETRIES = 3;

/** Shared load -> authorize -> mutate -> save loop with optimistic-concurrency retries (§7.2). */
export abstract class ShiftHandlerBase {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly repo: ShiftRepository) {}

  protected async mutate(shiftId: string, access: ShiftAccess, ctx: CommandContext, fn: (shift: Shift, now: Date) => void | Promise<void>) {
    for (let attempt = 1; ; attempt++) {
      const shift = await this.repo.load(shiftId);
      if (!shift || !this.canSee(shift, access)) throw notFound('SHIFT_NOT_FOUND', 'Shift not found');
      await fn(shift, new Date());
      try {
        await this.repo.save(shift, { ...ctx, correlationId: ctx.correlationId ?? shiftId });
        return shift.toView();
      } catch (err) {
        if (err instanceof ConcurrencyError && attempt < MAX_RETRIES) continue;
        throw err;
      }
    }
  }

  /** Employers only see their company's shifts; workers' rights are checked by the aggregate. */
  private canSee(shift: Shift, access: ShiftAccess): boolean {
    if (access.kind === 'employer') return shift.state.companyId === access.companyId;
    return true;
  }
}
