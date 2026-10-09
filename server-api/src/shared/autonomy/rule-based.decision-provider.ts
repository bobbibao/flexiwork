import { Injectable } from '@nestjs/common';
import { DecisionContext, DecisionOutcome, DecisionProvider } from './decision-provider.port';

/** Applies the calling module's deterministic rule. */
@Injectable()
export class RuleBasedDecisionProvider implements DecisionProvider {
  readonly name = 'rule-based';

  async decide(context: DecisionContext): Promise<DecisionOutcome> {
    return context.rule(context.inputs);
  }
}
