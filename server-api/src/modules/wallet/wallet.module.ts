import { Module } from '@nestjs/common';
import { WalletController } from './controllers/wallet.controller';
import { WalletService } from './application/wallet.service';
import { ReconciliationService } from './application/reconciliation.service';
import { SequelizeLedgerRepository } from './infrastructure/sequelize-ledger.repository';
import { ESCROW_HANDLERS } from './application/commands/escrow.handlers';
import { walletProvider } from './wallet.provider';

/** Wallet / Ledger / Escrow core context (docs/ARCHITECTURE.md §8). */
@Module({
  controllers: [WalletController],
  providers: [WalletService, ReconciliationService, SequelizeLedgerRepository, ...ESCROW_HANDLERS, ...walletProvider],
  exports: [WalletService, ReconciliationService, SequelizeLedgerRepository],
})
export class WalletModule {}
