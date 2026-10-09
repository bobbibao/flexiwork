import { Transaction } from 'sequelize';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { CommandContext, createEnvelope } from 'src/shared/events/event-envelope';

/** Writes a wallet.* integration event in the ledger transaction. */
export async function emitWalletEvent(
  outbox: OutboxService,
  t: Transaction,
  type: string,
  streamId: string,
  companyId: number | null,
  payload: Record<string, unknown>,
  ctx: CommandContext,
): Promise<void> {
  await outbox.enqueue(t, createEnvelope({ type, streamType: 'wallet', streamId, companyId, payload, ctx }));
}
