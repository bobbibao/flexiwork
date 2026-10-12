import { SnAuthModule } from '../sn-auth/sn-auth.module';
import { WorkerProfileModule } from '../worker-profile/worker-profile.module';
import { EmployerProfileModule } from '../employer-profile/employer-profile.module';
import { WalletModule } from '../wallet/wallet.module';
import { ShiftModule } from '../shift/shift.module';
import { MatchingModule } from '../matching/matching.module';

/** Shift Network context modules, in dependency order. */
export const SN_CONTEXT_MODULES: any[] = [SnAuthModule, WorkerProfileModule, EmployerProfileModule, WalletModule, ShiftModule, MatchingModule];
