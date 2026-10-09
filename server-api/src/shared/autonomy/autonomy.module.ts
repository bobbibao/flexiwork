import { Global, Module } from '@nestjs/common';
import { AutonomyPolicyService } from './autonomy-policy.service';
import { RuleBasedDecisionProvider } from './rule-based.decision-provider';
import { DECISION_PROVIDER } from './decision-provider.port';
import { ExceptionCaseService } from './exception-case.service';

@Global()
@Module({
  providers: [
    RuleBasedDecisionProvider,
    { provide: DECISION_PROVIDER, useExisting: RuleBasedDecisionProvider },
    AutonomyPolicyService,
    ExceptionCaseService,
  ],
  exports: [AutonomyPolicyService, ExceptionCaseService, DECISION_PROVIDER],
})
export class AutonomyModule {}
