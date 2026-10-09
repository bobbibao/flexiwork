import { CommandContext } from '../../events/event-envelope';

/**
 * Wallet commands other contexts may send through the CommandBus (the shift saga).
 * Handlers live in src/modules/wallet/application/commands.
 */
export class HoldEscrowCommand {
  constructor(
    readonly shiftId: string,
    readonly companyId: number,
    readonly amountVnd: number,
    readonly ctx: CommandContext,
  ) {}
}

export class ReleaseEscrowCommand {
  constructor(
    readonly shiftId: string,
    readonly companyId: number,
    readonly workerId: number,
    readonly grossVnd: number,
    readonly feeVnd: number,
    readonly ctx: CommandContext,
  ) {}
}

export class RefundEscrowCommand {
  constructor(
    readonly shiftId: string,
    readonly companyId: number,
    readonly ctx: CommandContext,
    /** Late-cancellation compensation paid to the worker out of escrow (gross, before PIT). */
    readonly compensation?: { workerId: number; grossVnd: number },
  ) {}
}
